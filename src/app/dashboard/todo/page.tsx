"use client";

import {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { X, Loader2, Plus, Trash2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import PageWrapper from "../../(components)/PageWrapper";
import Loader from "../../(components)/Loader";
import MarkdownRenderer from "../../(components)/MarkdownRenderer";
import { BLUE_Button, STONE_Button } from "../../../utils/CSS/Button.util";

interface Note {
  id: string;
  title: string | null;
  note: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const AUTOSAVE_INTERVAL_MS = 5000;
const TITLE_MAX_LENGTH = 100;
const NOTE_MAX_LENGTH = 5000;
const MAX_CLAMP_LINES = 8;

// Masonry layout constants
const MIN_COLUMN_WIDTH = 240;
const COLUMN_GAP = 16; // matches `gap-4`
const MAX_COLUMNS = 6;
const FALLBACK_CARD_HEIGHT = 150;

function counterColor(current: number, max: number): string {
  const ratio = current / max;
  if (ratio >= 1) return "text-red-400";
  if (ratio >= 0.9) return "text-amber-400";
  return "text-stone-600";
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** A note is considered "empty" if it has no title and no body. */
function isDraftEmpty(title: string, note: string): boolean {
  return title.trim().length === 0 && note.trim().length === 0;
}

interface NoteCardProps {
  note: Note;
  isDragging: boolean;
  isDragOver: boolean;
  onMeasure: (id: string, height: number) => void;
  onOpen: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
}

function NoteCard({
  note,
  isDragging,
  isDragOver,
  onMeasure,
  onOpen,
  onDelete,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: NoteCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Report card height to parent for masonry packing
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const measure = () => onMeasure(note.id, el.getBoundingClientRect().height);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [note.id, onMeasure]);

  const timestampLabel =
    note.updated_at && note.updated_at !== note.created_at
      ? `Last updated ${formatRelativeTime(note.updated_at)}`
      : `Created ${formatRelativeTime(note.created_at)}`;

  return (
    <div
      ref={cardRef}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
      className={`group relative flex w-full flex-col overflow-hidden rounded-lg border bg-stone-900/40 pt-4 pr-4 pb-7 pl-5 cursor-pointer transition-[border-color,box-shadow,opacity] duration-150 ${
        isDragging
          ? "opacity-40 border-stone-700"
          : isDragOver
            ? "border-blue-500 ring-2 ring-blue-500/40"
            : "border-stone-800 hover:border-stone-700 hover:shadow-lg hover:shadow-black/40"
      }`}
    >
      <button
        onClick={onDelete}
        draggable={false}
        aria-label="Delete note"
        className="absolute top-2 right-2 z-10 rounded-md bg-stone-900/80 p-1.5 text-stone-500 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100 cursor-pointer"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      {note.title && (
        <p className="mb-2 pr-6 truncate text-lg font-semibold text-white">
          {note.title}
        </p>
      )}

      <div
        className="flex-1 text-sm text-stone-400 **:max-w-full!"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: MAX_CLAMP_LINES,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {note.note.trim() ? (
          <MarkdownRenderer content={note.note} />
        ) : (
          <p className="italic text-stone-600">Empty note</p>
        )}
      </div>

      <p className="absolute bottom-2 left-5 text-[10px] text-stone-600">
        {timestampLabel}
      </p>
    </div>
  );
}

export default function TodoPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [fetching, setFetching] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState<string>("");
  const [draftNote, setDraftNote] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [dirty, setDirty] = useState<boolean>(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [cardHeights, setCardHeights] = useState<Record<string, number>>({});

  // Masonry measurement state
  const [gridEl, setGridEl] = useState<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Refs to avoid stale closures inside the autosave interval
  const dirtyRef = useRef(dirty);
  const draftTitleRef = useRef(draftTitle);
  const draftNoteRef = useRef(draftNote);
  const openNoteIdRef = useRef(openNoteId);

  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);
  useEffect(() => {
    draftTitleRef.current = draftTitle;
  }, [draftTitle]);
  useEffect(() => {
    draftNoteRef.current = draftNote;
  }, [draftNote]);
  useEffect(() => {
    openNoteIdRef.current = openNoteId;
  }, [openNoteId]);

  // Track grid width to compute column count
  useLayoutEffect(() => {
    if (!gridEl) return;

    const update = () => setContainerWidth(gridEl.clientWidth);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(gridEl);
    return () => observer.disconnect();
  }, [gridEl]);

  const handleMeasure = useCallback((id: string, height: number) => {
    setCardHeights((prev) => {
      // Ignore sub-pixel noise from ResizeObserver
      if (prev[id] !== undefined && Math.abs(prev[id] - height) < 1)
        return prev;
      return { ...prev, [id]: height };
    });
  }, []);

  const columnCount = useMemo(() => {
    if (containerWidth <= 0) return 1;
    const fitted = Math.floor(
      (containerWidth + COLUMN_GAP) / (MIN_COLUMN_WIDTH + COLUMN_GAP),
    );
    return Math.max(1, Math.min(MAX_COLUMNS, fitted));
  }, [containerWidth]);

  // Pack notes into the shortest column (Google Keep style)
  const columns = useMemo(() => {
    const cols: Note[][] = Array.from({ length: columnCount }, () => []);
    const colHeights = new Array<number>(columnCount).fill(0);

    for (const note of notes) {
      let target = 0;
      for (let i = 1; i < columnCount; i++) {
        if (colHeights[i] < colHeights[target] - 0.5) target = i;
      }

      cols[target].push(note);
      colHeights[target] +=
        (cardHeights[note.id] ?? FALLBACK_CARD_HEIGHT) + COLUMN_GAP;
    }

    return cols;
  }, [notes, columnCount, cardHeights]);

  // Data fetching
  const fetchNotes = useCallback(async () => {
    setFetching(true);
    try {
      const response = await axios.get("/api/dashboard/todo");
      if (response.data.success) {
        setNotes(response.data.data);
      }
    } catch (err) {
      toast.error("Failed to load your notes");
      console.error(err);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    const load = () => {
      fetchNotes();
    };
    load();
  }, [fetchNotes]);

  const persistNote = useCallback(
    async (id: string, title: string, note: string, silent = false) => {
      setSaving(true);
      try {
        const response = await axios.put(`/api/dashboard/todo/${id}`, {
          title: title.trim() || null,
          note,
        });
        if (response.data.success) {
          setNotes((prev) =>
            prev.map((n) =>
              n.id === id
                ? {
                    ...n,
                    title: title.trim() || null,
                    note,
                    updated_at: response.data.data.updated_at,
                  }
                : n,
            ),
          );
          setDirty(false);
          if (!silent) toast.success("Note saved");
        }
      } catch (err) {
        toast.error("Failed to save note");
        console.error(err);
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  /**
   * Deletes a note from the server + local state.
   * Pass `silent = true` when discarding a note the user never wrote into,
   * so we don't show a "deleted" toast for something they never saw.
   */
  const deleteNoteFromServer = useCallback(
    async (id: string, silent = false): Promise<boolean> => {
      try {
        const response = await axios.delete(`/api/dashboard/todo/${id}`);
        if (response.data.success) {
          setNotes((prev) => prev.filter((n) => n.id !== id));
          setCardHeights((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
          if (!silent) toast.success("Note deleted");
          return true;
        }
        return false;
      } catch (err) {
        if (!silent) toast.error("Failed to delete note");
        console.error(err);
        return false;
      }
    },
    [],
  );

  // Periodic autosave while a note is open.
  // Only runs when there's real content — empty drafts are never persisted.
  useEffect(() => {
    if (!openNoteId) return;

    const interval = setInterval(() => {
      if (!dirtyRef.current || !openNoteIdRef.current) return;

      const hasContent = !isDraftEmpty(
        draftTitleRef.current,
        draftNoteRef.current,
      );
      if (!hasContent) return;

      persistNote(
        openNoteIdRef.current,
        draftTitleRef.current,
        draftNoteRef.current,
        true,
      );
    }, AUTOSAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [openNoteId, persistNote]);

  const handleOpenNote = (n: Note) => {
    setOpenNoteId(n.id);
    setDraftTitle(n.title || "");
    setDraftNote(n.note);
    setDirty(false);
  };

  const handleCloseNote = async () => {
    if (!openNoteId) return;

    const hasContent = !isDraftEmpty(draftTitle, draftNote);

    if (!hasContent) {
      // User opened a fresh note and closed it without typing anything.
      // Discard it so we don't leave an empty ghost note behind.
      await deleteNoteFromServer(openNoteId, true);
    } else if (dirty) {
      await persistNote(openNoteId, draftTitle, draftNote, true);
    }

    setOpenNoteId(null);
    setDraftTitle("");
    setDraftNote("");
    setDirty(false);
  };

  const handleCreateNote = async () => {
    setCreating(true);
    try {
      const response = await axios.post("/api/dashboard/todo", {
        title: "",
        note: "",
      });
      if (response.data.success) {
        const newNote = response.data.data;
        setNotes((prev) => [...prev, newNote]);
        handleOpenNote(newNote);
      }
    } catch (err) {
      toast.error("Failed to create note");
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    const ok = await deleteNoteFromServer(id);
    if (ok && openNoteId === id) {
      setOpenNoteId(null);
      setDraftTitle("");
      setDraftNote("");
      setDirty(false);
    }
  };

  const persistOrder = useCallback(async (order: string[]) => {
    try {
      await axios.put("/api/dashboard/todo/reorder", { order });
    } catch (err) {
      toast.error("Failed to save new order");
      console.error(err);
    }
  }, []);

  // Drag and drop handlers — reorders the flat array, packer re-flows
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (id !== draggingId) setDragOverId(id);
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("text/plain") || draggingId;

    if (!sourceId || sourceId === targetId) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }

    setNotes((prev) => {
      const fromIndex = prev.findIndex((n) => n.id === sourceId);
      const toIndex = prev.findIndex((n) => n.id === targetId);
      if (fromIndex === -1 || toIndex === -1) return prev;

      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);

      persistOrder(updated.map((n) => n.id));
      return updated;
    });

    setDraggingId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverId(null);
  };

  const openNote = notes.find((n) => n.id === openNoteId) || null;

  return (
    <PageWrapper withSidebar sidebarRole="user">
      <div className="min-h-screen p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-medium text-white mb-2">
            My Notes
          </h1>
          <p className="text-stone-400 text-sm">
            Your personal notes and todos. Drag to reorder.
          </p>
        </div>

        <button
          onClick={handleCreateNote}
          disabled={creating}
          className="w-full max-w-2xl mx-auto flex items-center gap-3 px-4 py-3 bg-stone-900/40 border border-stone-800 hover:border-stone-700 rounded-lg text-stone-400 text-sm transition-colors cursor-pointer mb-8 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Take a note...
        </button>

        {fetching ? (
          <Loader />
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-stone-500 text-center">No notes yet.</p>
          </div>
        ) : (
          <div ref={setGridEl} className="flex items-start gap-4">
            {columns.map((columnNotes, columnIndex) => (
              <div
                key={columnIndex}
                className="flex min-w-0 flex-1 flex-col gap-4"
              >
                {columnNotes.map((n) => (
                  <NoteCard
                    key={n.id}
                    note={n}
                    isDragging={draggingId === n.id}
                    isDragOver={dragOverId === n.id}
                    onMeasure={handleMeasure}
                    onOpen={() => handleOpenNote(n)}
                    onDelete={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(n.id);
                    }}
                    onDragStart={(e) => handleDragStart(e, n.id)}
                    onDragOver={(e) => handleDragOver(e, n.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, n.id)}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </div>
            ))}
          </div>
        )}

        {openNote && (
          <div
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 md:p-8"
            onClick={handleCloseNote}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full h-full max-w-4xl bg-stone-950 border border-stone-800 rounded-xl flex flex-col overflow-hidden"
            >
              <div className="flex items-start justify-between px-5 py-4 border-b border-stone-800 gap-4">
                <div className="flex-1 min-w-0">
                  <input
                    value={draftTitle}
                    onChange={(e) => {
                      if (e.target.value.length <= TITLE_MAX_LENGTH) {
                        setDraftTitle(e.target.value);
                        setDirty(true);
                      }
                    }}
                    maxLength={TITLE_MAX_LENGTH}
                    placeholder="Title"
                    className="w-full bg-transparent text-white text-lg font-medium placeholder-stone-600 focus:outline-none"
                  />
                  <p
                    className={`text-xs mt-1 transition-colors ${counterColor(
                      draftTitle.length,
                      TITLE_MAX_LENGTH,
                    )}`}
                  >
                    {draftTitle.length}/{TITLE_MAX_LENGTH}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {saving && (
                    <span className="text-xs text-stone-500 flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving
                    </span>
                  )}
                  <button
                    onClick={() => openNoteId && handleDeleteNote(openNoteId)}
                    className={`px-3 py-1.5 ${STONE_Button} text-stone-400 hover:text-red-400 rounded-lg text-sm transition-colors cursor-pointer flex items-center gap-2`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleCloseNote}
                    className={`px-3 py-1.5 ${BLUE_Button} text-white rounded-lg text-sm transition-colors cursor-pointer flex items-center gap-2`}
                  >
                    <X className="h-4 w-4" />
                    Close
                  </button>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden">
                <div className="flex flex-col h-full border-b lg:border-b-0 lg:border-r border-stone-800">
                  <textarea
                    value={draftNote}
                    onChange={(e) => {
                      if (e.target.value.length <= NOTE_MAX_LENGTH) {
                        setDraftNote(e.target.value);
                        setDirty(true);
                      }
                    }}
                    maxLength={NOTE_MAX_LENGTH}
                    autoFocus
                    className="w-full flex-1 p-5 bg-transparent text-white placeholder-stone-600 focus:outline-none resize-none font-mono text-sm leading-relaxed"
                    placeholder={
                      "Write notes in Markdown...\n\n# Heading\n**bold**, *italic*, `code`\n- bullet list\n1. numbered list\n- [x] checked task\n- [ ] unchecked task\n> blockquote\n```\ncode block\n```"
                    }
                  />
                  <p
                    className={`text-xs px-5 pb-3 text-right transition-colors ${counterColor(
                      draftNote.length,
                      NOTE_MAX_LENGTH,
                    )}`}
                  >
                    {draftNote.length}/{NOTE_MAX_LENGTH}
                  </p>
                </div>
                <div className="w-full h-full p-5 overflow-y-auto">
                  {draftNote.trim() ? (
                    <MarkdownRenderer content={draftNote} />
                  ) : (
                    <p className="text-stone-600 text-sm italic">
                      Nothing to preview yet...
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
