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

  useEffect(() => {
    setEditedContent(content || "Text");
  }, [content]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

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
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{
            width: "100%",
            height: "100%",
            minHeight: `${size.height}px`,
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
        <div style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
          {editedContent || "Text"}
        </div>
      )}
    </div>
  );
}
