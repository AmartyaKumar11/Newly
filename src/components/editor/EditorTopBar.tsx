"use client";

import { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@/stores/editorStore";

interface EditorTopBarProps {
  newsletterTitle?: string;
  onTitleChange?: (title: string) => void;
}

export function EditorTopBar({ newsletterTitle, onTitleChange }: EditorTopBarProps) {
  const { isDirty, isSaving, lastSaved } = useEditorStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(newsletterTitle || "Untitled Newsletter");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedTitle(newsletterTitle || "Untitled Newsletter");
  }, [newsletterTitle]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleTitleClick = () => {
    setIsEditing(true);
  };

  const handleTitleBlur = () => {
    setIsEditing(false);
    if (onTitleChange && editedTitle.trim()) {
      onTitleChange(editedTitle.trim());
    } else {
      setEditedTitle(newsletterTitle || "Untitled Newsletter");
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setEditedTitle(newsletterTitle || "Untitled Newsletter");
      e.currentTarget.blur();
    }
  };

  const getSaveStatus = () => {
    if (isSaving) return "Saving...";
    if (isDirty) return "Unsaved changes";
    if (lastSaved) return `Saved ${lastSaved.toLocaleTimeString()}`;
    return "Saved";
  };

  return (
    <div className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-4">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            className="rounded border border-blue-500 bg-white px-2 py-1 text-sm font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:text-zinc-50"
          />
        ) : (
          <h1
            onClick={handleTitleClick}
            className="cursor-pointer text-sm font-semibold text-zinc-900 transition hover:text-blue-600 dark:text-zinc-50 dark:hover:text-blue-400"
          >
            {editedTitle}
          </h1>
        )}
        <span
          className={`text-xs ${
            isDirty
              ? "text-amber-600 dark:text-amber-400"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          {getSaveStatus()}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {/* Undo button - disabled in Phase 2 */}
        <button
          disabled
          className="flex h-8 w-8 items-center justify-center rounded border border-zinc-300 text-zinc-400 transition disabled:cursor-not-allowed dark:border-zinc-700"
          title="Undo (coming soon)"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
            />
          </svg>
        </button>
        {/* Redo button - disabled in Phase 2 */}
        <button
          disabled
          className="flex h-8 w-8 items-center justify-center rounded border border-zinc-300 text-zinc-400 transition disabled:cursor-not-allowed dark:border-zinc-700"
          title="Redo (coming soon)"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
