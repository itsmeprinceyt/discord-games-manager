"use client";

import {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
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
const ROW_UNIT = 8; // px — grid track height; must match gridAutoRows below
const MAX_CLAMP_LINES = 8; // preview content never grows past this many lines
const FALLBACK_ROW_SPAN = 18; // used only before a card's real height is measured

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

interface NoteCardProps {
  note: Note;
  rowSpan: number;
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
  rowSpan,
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

  // Measure the card's real, natural height (content-driven, thanks to
  // alignItems: 'start' on the grid so items never stretch) and report it
  // up so the parent can turn it into an accurate grid-row span. This is
  // what makes the bento grid actually dynamic instead of bucketed.
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const measure = () => onMeasure(note.id, el.getBoundingClientRect().height);
    measure();

    const observer = new ResizeObserver(() => measure());
    observer.observe(el);
    return () => observer.disconnect();
  }, [note.id, note.title, note.note, onMeasure]);

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
      style={{
        gridRow: `span ${rowSpan}`,
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
      className={`group relative flex flex-col overflow-hidden bg-stone-900/40 border rounded-lg pt-4 pr-4 pb-7 pl-5 cursor-pointer transition-all ${
        isDragging
          ? "opacity-40"
          : isDragOver
            ? "border-blue-600 scale-[1.02]"
            : "border-stone-800 hover:border-stone-700"
      }`}
    >
      <button
        onClick={onDelete}
        draggable={false}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-stone-900/80 text-stone-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      {note.title && (
        <p className="text-white font-semibold text-lg mb-2 pr-6 truncate">
          {note.title}
        </p>
      )}

      <div
        className="flex-1 text-stone-400 text-sm **:max-w-full!"
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
          <p className="text-stone-600 italic">Empty note</p>
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

  const handleMeasure = useCallback((id: string, height: number) => {
    setCardHeights((prev) => {
      // Avoid re-render storms from ResizeObserver firing on sub-pixel noise
      if (prev[id] && Math.abs(prev[id] - height) < 1) return prev;
      return { ...prev, [id]: height };
    });
  }, []);

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

  useEffect(() => {
    if (!openNoteId) return;

    const interval = setInterval(() => {
      if (dirtyRef.current && openNoteIdRef.current) {
        persistNote(
          openNoteIdRef.current,
          draftTitleRef.current,
          draftNoteRef.current,
          true,
        );
      }
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
    if (dirty && openNoteId) {
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
    try {
      const response = await axios.delete(`/api/dashboard/todo/${id}`);
      if (response.data.success) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
        setCardHeights((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        if (openNoteId === id) {
          setOpenNoteId(null);
          setDraftTitle("");
          setDraftNote("");
          setDirty(false);
        }
        toast.success("Note deleted");
      }
    } catch (err) {
      toast.error("Failed to delete note");
      console.error(err);
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

  // --- Drag and drop ---------------------------------------------------
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
            My Notes{" "}
            <span className="animate-pulse font-normal text-xs text-green-600">
              (work in progress)
            </span>
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
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gridAutoFlow: "dense",
              gridAutoRows: `${ROW_UNIT}px`,
              alignItems: "start", // critical: stops items stretching to track height,
              // so each card keeps its true natural height
            }}
          >
            {notes.map((n) => {
              const measured = cardHeights[n.id];
              const rowSpan = measured
                ? Math.ceil(measured / ROW_UNIT) + 1 // +1 row buffer against overlap
                : FALLBACK_ROW_SPAN;

              return (
                <NoteCard
                  key={n.id}
                  note={n}
                  rowSpan={rowSpan}
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
              );
            })}
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
