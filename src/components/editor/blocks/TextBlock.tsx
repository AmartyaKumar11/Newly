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
  // This runs reactively on content/size/style changes and during resize
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const checkOverflow = () => {
      // Compare scrollHeight (content height) vs clientHeight (visible box height)
      // Small tolerance (1px) accounts for rounding/subpixel rendering
      const overflow = el.scrollHeight > el.clientHeight + 1;
      setIsOverflowing(overflow);
    };

    // Check immediately
    checkOverflow();

    // Also check after a brief delay to catch resize transitions
    // This ensures overflow detection updates smoothly during drag resize
    const timeoutId = setTimeout(checkOverflow, 50);

    return () => clearTimeout(timeoutId);
  }, [editedContent, size.width, size.height, styles.fontSize, styles.lineHeight, styles.letterSpacing, isEditing]);

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

  const verticalAlign = styles.verticalAlign || "top";
  const justifyContentMap = {
    top: "flex-start",
    center: "center",
    bottom: "flex-end",
  };

  // Build text effects CSS (non-destructive, CSS-only overlays)
  const buildTextEffects = () => {
    const effects = styles.effects;
    if (!effects) return {};

    const textShadow: string[] = [];
    let webkitTextStroke: string | undefined = undefined;
    let backgroundColor: string | undefined = undefined;

    // Shadow effect
    if (effects.shadow?.enabled) {
      const offsetX = effects.shadow.offsetX ?? 0;
      const offsetY = effects.shadow.offsetY ?? 0;
      const blur = effects.shadow.blur ?? 0;
      const color = effects.shadow.color || "#000000";
      const opacity = effects.shadow.opacity ?? 0.5;
      
      // Convert hex to rgba if needed
      let rgbaColor = color;
      if (color.startsWith("#")) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        rgbaColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
      }
      
      textShadow.push(`${offsetX}px ${offsetY}px ${blur}px ${rgbaColor}`);
    }

    // Outline effect (using -webkit-text-stroke)
    if (effects.outline?.enabled) {
      const width = effects.outline.width ?? 1;
      const color = effects.outline.color || "#000000";
      webkitTextStroke = `${width}px ${color}`;
    }

    // Highlight effect (background color with opacity)
    if (effects.highlight?.enabled) {
      const color = effects.highlight.color || "#ffff00";
      const opacity = effects.highlight.opacity ?? 0.3;
      
      // Convert hex to rgba if needed
      if (color.startsWith("#")) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        backgroundColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
      } else {
        backgroundColor = color;
      }
    }

    return {
      textShadow: textShadow.length > 0 ? textShadow.join(", ") : undefined,
      WebkitTextStroke: webkitTextStroke,
      WebkitTextStrokeColor: effects.outline?.enabled ? effects.outline.color || "#000000" : undefined,
      WebkitTextStrokeWidth: effects.outline?.enabled ? `${effects.outline.width ?? 1}px` : undefined,
      backgroundColor: backgroundColor,
    };
  };

  const effectStyles = buildTextEffects();

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
        display: "flex",
        flexDirection: "column",
        justifyContent: justifyContentMap[verticalAlign], // Vertical alignment using flexbox
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
            flex: "1 1 auto", // Fill available space in flex container
            overflow: "hidden", // No scrollbars, keep fixed box
            fontSize: `${styles.fontSize || 16}px`,
            fontWeight: styles.fontWeight || "normal",
            fontFamily: styles.fontFamily || "inherit",
            color: getDefaultTextColor(),
            textAlign: styles.textAlign || "left",
            lineHeight: styles.lineHeight || 1.4, // Default 1.4 if missing
            letterSpacing: styles.letterSpacing !== undefined ? `${styles.letterSpacing}px` : "0px", // Default 0 if missing
            backgroundColor: "transparent",
            border: "none",
            outline: "none",
            resize: "none",
            padding: "0",
            margin: "0",
            // Note: Textarea content always starts at top when editing
            // Vertical alignment primarily affects display mode (non-editing)
            // This is acceptable UX - editing mode fills container, display mode respects alignment
          }}
        />
      ) : (
        <div
          ref={contentRef}
          style={{
            width: "100%",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            fontSize: `${styles.fontSize || 16}px`,
            fontWeight: styles.fontWeight || "normal",
            fontFamily: styles.fontFamily || "inherit",
            color: getDefaultTextColor(),
            textAlign: styles.textAlign || "left",
            lineHeight: styles.lineHeight || 1.4,
            letterSpacing: styles.letterSpacing !== undefined ? `${styles.letterSpacing}px` : "0px",
            ...effectStyles, // Apply text effects (shadow, outline, highlight)
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
