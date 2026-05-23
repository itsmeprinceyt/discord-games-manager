"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Loader2, Edit, Save } from "lucide-react";
import { BLUE_Button, STONE_Button } from "../../../utils/CSS/Button.util";
import axios from "axios";
import Loader from "../Loader";
import toast from "react-hot-toast";
import MarkdownRenderer from "../MarkdownRenderer";

interface TodoModalProps {
  account_id: string;
  isOpen: boolean;
  onClose: () => void;
  account_name?: string;
}

export default function TodoModal({
  account_id,
  isOpen,
  onClose,
  account_name = "Account",
}: TodoModalProps) {
  const [todo, setTodo] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const fetchTodo = useCallback(async () => {
    if (!account_id) return;
    setFetching(true);
    setError("");
    try {
      const response = await axios.get(
        `/api/dashboard/account/${account_id}/todo`,
      );
      if (response.data.success) {
        setTodo(response.data.data.todo || "");
      }
    } catch (error) {
      console.error("Error fetching todo:", error);
      setError("Failed to load todo. Please try again.");
    } finally {
      setFetching(false);
    }
  }, [account_id]);

  useEffect(() => {
    if (isOpen && account_id) {
      fetchTodo();
    } else {
      setTodo("");
      setIsEditing(false);
      setError("");
    }
  }, [isOpen, account_id, fetchTodo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account_id) return;
    if (!isEditing) {
      setIsEditing(true);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await axios.put(
        `/api/dashboard/account/${account_id}/todo`,
        { todo: todo.trim() },
      );
      if (response.data.success) {
        setIsEditing(false);
        toast.success(response.data.message);
      }
    } catch (error) {
      console.error("Error updating todo:", error);
      setError("Failed to save todo. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) onClose();
  };

  if (!isOpen || !account_id) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
      <div className="bg-black/90 border border-stone-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-medium text-white">
              {account_name} — Notes
            </h2>
            {!isEditing && (
              <span className="px-2 py-1 bg-stone-800/50 text-stone-300 text-xs rounded">
                Read-only
              </span>
            )}
            {isEditing && (
              <span className="px-2 py-1 bg-blue-900/30 text-blue-400 text-xs rounded border border-blue-800">
                Editing
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            disabled={saving}
            className="p-2 hover:bg-stone-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <X className="h-5 w-5 text-stone-400" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-hidden flex flex-col"
        >
          <div className="flex-1 overflow-hidden p-6">
            {fetching ? (
              <Loader />
            ) : (
              <div className="h-full flex flex-col gap-3">
                {isEditing ? (
                  <textarea
                    value={todo}
                    onChange={(e) => {
                      setTodo(e.target.value);
                      setError("");
                    }}
                    className="w-full flex-1 min-h-64 p-4 bg-stone-900/50 border border-stone-700 rounded-lg text-white placeholder-stone-500 focus:outline-none focus:border-blue-600 cursor-text resize-none font-mono text-sm leading-relaxed"
                    placeholder={
                      "Write notes in Markdown...\n\n# Heading\n**bold**, *italic*, `code`\n- bullet list\n1. numbered list\n- [x] checked task\n- [ ] unchecked task\n> blockquote\n```\ncode block\n```"
                    }
                    disabled={saving}
                    autoFocus
                  />
                ) : (
                  <div className="flex-1 min-h-64 p-4 bg-stone-900/50 border border-stone-700 rounded-lg overflow-y-auto">
                    {todo ? (
                      <MarkdownRenderer content={todo} />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-stone-500 text-center text-sm">
                          No notes yet. Click &quot;Edit&quot; to add your first
                          note.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {error && <p className="text-xs text-red-500">{error}</p>}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-stone-800 bg-black/50">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={saving}
                className={`flex-1 p-3 ${STONE_Button} text-stone-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
              >
                Close
              </button>
              <button
                type="submit"
                disabled={fetching || saving}
                className={`flex-1 p-3 ${isEditing ? `${BLUE_Button} cursor-pointer` : `${STONE_Button} cursor-pointer`} text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : isEditing ? (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4" />
                    Edit
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
