"use client";

import { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { useEditorStateStore } from "@/stores/editorStateStore";
import { ThemeToggle } from "@/components/dashboard/ThemeToggle";

interface EditorTopBarProps {
  newsletterTitle?: string;
  onTitleChange?: (title: string) => void;
  onAIClick?: () => void;
}

export function EditorTopBar({ newsletterTitle, onTitleChange, onAIClick }: EditorTopBarProps) {
  const { isDirty, isSaving, lastSaved } = useEditorStore();
  const { canUndo, canRedo, undo, redo, zoomLevel, setZoomLevel } = useEditorStateStore();
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

  // Zoom functions
  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + 0.1, 1); // Max 100%
    setZoomLevel(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - 0.1, 0.1); // Min 10%
    setZoomLevel(newZoom);
  };

  const handleZoomFit = () => {
    // Set to 0.1 to trigger auto-fit recalculation in canvas wrapper
    setZoomLevel(0.1);
  };

  const formatZoom = (zoom: number) => {
    return `${Math.round(zoom * 100)}%`;
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
        {/* Theme Toggle */}
        <ThemeToggle />
        
        {/* Zoom Controls */}
        <div className="flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-1 dark:border-zinc-700 dark:bg-zinc-800">
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= 0.1}
            className="flex h-7 w-7 items-center justify-center rounded text-zinc-600 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-400 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:disabled:text-zinc-600"
            title="Zoom Out"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button
            onClick={handleZoomFit}
            className="px-2 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
            title="Fit to Screen"
          >
            {formatZoom(zoomLevel)}
          </button>
          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= 1}
            className="flex h-7 w-7 items-center justify-center rounded text-zinc-600 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-400 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:disabled:text-zinc-600"
            title="Zoom In"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* AI Generate Button */}
        {onAIClick && (
          <button
            onClick={onAIClick}
            className="flex items-center gap-2 rounded-lg border border-blue-600 bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700 dark:border-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
            title="Generate with AI"
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
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span>Generate with AI</span>
          </button>
        )}
        {/* Undo button */}
        <button
          onClick={undo}
          disabled={!canUndo()}
          className="flex h-8 w-8 items-center justify-center rounded border border-zinc-300 text-zinc-600 transition hover:border-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:text-zinc-400 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-blue-400 dark:hover:text-blue-400 dark:disabled:text-zinc-600"
          title="Undo (Ctrl+Z)"
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
        {/* Redo button */}
        <button
          onClick={redo}
          disabled={!canRedo()}
          className="flex h-8 w-8 items-center justify-center rounded border border-zinc-300 text-zinc-600 transition hover:border-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:text-zinc-400 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-blue-400 dark:hover:text-blue-400 dark:disabled:text-zinc-600"
          title="Redo (Ctrl+Shift+Z)"
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
