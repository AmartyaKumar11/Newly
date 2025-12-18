"use client";

import { useState, useRef, useEffect } from "react";
import type { TextBlock } from "@/types/blocks";
import { useEditorStateStore } from "@/stores/editorStateStore";

interface TextBlockComponentProps {
  block: TextBlock;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function TextBlockComponent({
  block,
  isSelected,
  onSelect,
  onMouseEnter,
  onMouseLeave,
}: TextBlockComponentProps) {
  const { position, size, styles, content } = block;
  const { updateBlock } = useEditorStateStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content || "Text");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement | HTMLTextAreaElement | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    setEditedContent(content || "Text");
  }, [content]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // Detect vertical overflow (purely visual, not persisted)
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const checkOverflow = () => {
      const overflow = el.scrollHeight > el.clientHeight + 1; // small tolerance
      setIsOverflowing(overflow);
    };

    checkOverflow();
  }, [editedContent, size.height, styles.fontSize, styles.lineHeight, isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    updateBlock(block.id, { content: editedContent || "Text" });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    } else if (e.key === "Escape") {
      setEditedContent(content || "Text");
      setIsEditing(false);
    }
  };

  // Detect dark mode and set default text color
  const getDefaultTextColor = () => {
    if (styles.color) return styles.color;
    // Check if dark mode is active
    const isDarkMode = document.documentElement.classList.contains("dark") ||
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    return isDarkMode ? "#fafafa" : "#000000";
  };

  return (
    <div
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onDoubleClick={handleDoubleClick}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden", // Respect fixed bounding box, hide overflow
        fontSize: `${styles.fontSize || 16}px`,
        fontWeight: styles.fontWeight || "normal",
        fontFamily: styles.fontFamily || "inherit",
        color: getDefaultTextColor(),
        textAlign: styles.textAlign || "left",
        backgroundColor: styles.backgroundColor || "transparent",
        borderColor: styles.borderColor || "transparent",
        borderWidth: styles.borderWidth ? `${styles.borderWidth}px` : "0",
        borderRadius: styles.borderRadius ? `${styles.borderRadius}px` : "0",
        opacity: styles.opacity !== undefined ? styles.opacity : 1,
        cursor: isEditing ? "text" : "pointer",
        outline: isSelected ? "2px solid #3b82f6" : "none",
        outlineOffset: "2px",
      }}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          ref={contentRef as any}
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{
            width: "100%",
            height: "100%",
            minHeight: `${size.height}px`,
            overflow: "hidden", // No scrollbars, keep fixed box
            fontSize: `${styles.fontSize || 16}px`,
            fontWeight: styles.fontWeight || "normal",
            fontFamily: styles.fontFamily || "inherit",
            color: getDefaultTextColor(),
            textAlign: styles.textAlign || "left",
            backgroundColor: "transparent",
            border: "none",
            outline: "none",
            resize: "none",
            padding: "0",
            margin: "0",
          }}
        />
      ) : (
        <div
          ref={contentRef}
          style={{
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
          }}
        >
          {editedContent || "Text"}
        </div>
      )}

      {/* Overflow indicators (visual only, no state mutation) */}
      {isOverflowing && (
        <>
          {/* Gradient fade at bottom (Canva-style) */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 24,
              pointerEvents: "none",
              background:
                "linear-gradient(to bottom, rgba(24,24,27,0) 0%, rgba(24,24,27,0.6) 100%)",
            }}
          />
          {/* Small overflow badge in bottom-right */}
          <div
            style={{
              position: "absolute",
              right: 4,
              bottom: 4,
              padding: "0 6px",
              borderRadius: 9999,
              fontSize: 10,
              lineHeight: "16px",
              backgroundColor: "rgba(24,24,27,0.9)",
              color: "#f9fafb",
              pointerEvents: "none",
            }}
          >
            ⋯ text clipped
          </div>
        </>
      )}
    </div>
  );
}
