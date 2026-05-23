"use client";

import { useState, useEffect, useCallback } from "react";
import { Edit, Save, X, Loader2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import PageWrapper from "../../(components)/PageWrapper";
import Loader from "../../(components)/Loader";
import MarkdownRenderer from "../../(components)/MarkdownRenderer";
import { BLUE_Button, STONE_Button } from "../../../utils/CSS/Button.util";

export default function TodoPage() {
  const [todo, setTodo] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [editDraft, setEditDraft] = useState<string>("");

  const fetchTodo = useCallback(async () => {
    setFetching(true);
    try {
      const response = await axios.get("/api/dashboard/todo");
      if (response.data.success) {
        setTodo(response.data.data.todo || "");
      }
    } catch (err) {
      toast.error("Failed to load your notes");
      console.error(err);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchTodo();
  }, [fetchTodo]);

  const handleEditStart = () => {
    setEditDraft(todo);
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setEditDraft("");
    setIsEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await axios.put("/api/dashboard/todo", {
        todo: editDraft.trim(),
      });
      if (response.data.success) {
        setTodo(editDraft.trim());
        setIsEditing(false);
        setEditDraft("");
        toast.success("Notes saved successfully!");
      }
    } catch (err) {
      toast.error("Failed to save notes");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageWrapper withSidebar sidebarRole="user">
      <div className="min-h-screen p-4 md:p-6">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-medium text-white mb-2">
              My Notes
            </h1>
            <p className="text-stone-400 text-sm">
              Your personal notes and todos. Supports Markdown.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleEditCancel}
                  disabled={saving}
                  className={`px-4 py-2 ${STONE_Button} text-stone-300 rounded-lg text-sm transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`px-4 py-2 ${BLUE_Button} text-white rounded-lg text-sm transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={handleEditStart}
                disabled={fetching}
                className={`px-4 py-2 ${STONE_Button} text-stone-300 rounded-lg text-sm transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {fetching ? (
          <Loader />
        ) : isEditing ? (
          <div className="space-y-3">
            {/* Editor + Preview side by side on large screens */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Editor */}
              <div className="flex flex-col gap-2">
                <p className="text-xs text-stone-500 font-medium uppercase tracking-wider">
                  Editor
                </p>
                <textarea
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  disabled={saving}
                  autoFocus
                  className="w-full min-h-[60vh] p-4 bg-stone-900/50 border border-stone-700 rounded-lg text-white placeholder-stone-500 focus:outline-none focus:border-blue-600 cursor-text resize-none font-mono text-sm leading-relaxed"
                  placeholder={
                    "Write notes in Markdown...\n\n# Heading\n**bold**, *italic*, `code`\n- bullet list\n1. numbered list\n- [x] checked task\n- [ ] unchecked task\n> blockquote\n```\ncode block\n```"
                  }
                />
              </div>

              {/* Live Preview */}
              <div className="flex flex-col gap-2">
                <p className="text-xs text-stone-500 font-medium uppercase tracking-wider">
                  Preview
                </p>
                <div className="w-full min-h-[60vh] p-4 bg-stone-900/50 border border-stone-700 rounded-lg overflow-y-auto">
                  {editDraft.trim() ? (
                    <MarkdownRenderer content={editDraft} />
                  ) : (
                    <p className="text-stone-600 text-sm italic">
                      Nothing to preview yet...
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Markdown cheatsheet */}
            <div className="p-3 bg-stone-950 border border-stone-800 rounded-lg">
              <p className="text-xs text-stone-500 mb-2 font-medium">
                Markdown reference
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-1 text-xs text-stone-600 font-mono">
                <span># Heading 1</span>
                <span>## Heading 2</span>
                <span>**bold**</span>
                <span>*italic*</span>
                <span>`inline code`</span>
                <span>~~strikethrough~~</span>
                <span>- bullet item</span>
                <span>1. ordered item</span>
                <span>- [x] checked</span>
                <span>- [ ] unchecked</span>
                <span>{"> blockquote"}</span>
                <span>[link](url)</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-stone-900/30 border border-stone-800 rounded-lg p-6 min-h-[40vh]">
            {todo.trim() ? (
              <MarkdownRenderer content={todo} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-16 gap-3">
                <p className="text-stone-500 text-center">No notes yet.</p>
                <button
                  onClick={handleEditStart}
                  className={`px-4 py-2 ${STONE_Button} text-stone-300 rounded-lg text-sm transition-colors cursor-pointer flex items-center gap-2`}
                >
                  <Edit className="h-4 w-4" />
                  Start writing
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
