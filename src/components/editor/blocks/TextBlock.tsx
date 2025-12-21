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

  // Get preset defaults for each effect type
  const getEffectDefaults = (type: string) => {
    switch (type) {
      case "shadow":
        return { offsetX: 2, offsetY: 2, blur: 4, color: "#000000" };
      case "lift":
        return { offsetX: 0, offsetY: -3, blur: 8, color: "#000000" };
      case "hollow":
        return { color: "#000000" };
      case "outline":
        return { color: "#000000" };
      case "echo":
        return { offsetX: 2, offsetY: 2, color: "#000000" };
      case "glitch":
        return { offsetX: 2, offsetY: 0, color: "#000000" };
      case "neon":
        return { blur: 8, color: "#00ffff" };
      case "background":
        return { color: "#ffff00" };
      default:
        return {};
    }
  };

  // Render effect layers (non-destructive, absolute positioning)
  // Backward compatibility: missing textEffect or type "none" = no effects
  const renderEffectLayers = () => {
    const textEffect = styles.textEffect;
    // Missing textEffect or type "none" = no effects (backward compatible)
    if (!textEffect || textEffect.type === "none" || !textEffect.type) {
      return null;
    }

    const defaults = getEffectDefaults(textEffect.type);
    const config = { ...defaults, ...textEffect.config };
    const baseTextColor = getDefaultTextColor();
    const fontSize = styles.fontSize || 16;
    const fontWeight = styles.fontWeight || "normal";
    const fontStyle = styles.fontStyle || "normal";
    const fontFamily = styles.fontFamily || "inherit";
    const textAlign = styles.textAlign || "left";
    const lineHeight = styles.lineHeight || 1.4;
    const letterSpacing = styles.letterSpacing !== undefined ? `${styles.letterSpacing}px` : "0px";

    const baseStyle: React.CSSProperties = {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      whiteSpace: "pre-wrap",
      wordWrap: "break-word",
      fontSize: `${fontSize}px`,
      fontWeight,
      fontStyle,
      fontFamily,
      textAlign,
      lineHeight,
      letterSpacing,
      pointerEvents: "none",
      margin: 0,
      padding: 0,
    };

    const layers: JSX.Element[] = [];

    switch (textEffect.type) {
      case "shadow":
        layers.push(
          <div
            key="shadow-layer"
            style={{
              ...baseStyle,
              color: config.color || "#000000",
              opacity: 0.5,
              transform: `translate(${config.offsetX || 2}px, ${config.offsetY || 2}px)`,
              filter: `blur(${config.blur || 4}px)`,
              zIndex: 1,
            }}
          >
            {editedContent || "Text"}
          </div>
        );
        break;

      case "lift":
        layers.push(
          <div
            key="lift-shadow"
            style={{
              ...baseStyle,
              color: config.color || "#000000",
              opacity: 0.3,
              transform: `translate(0, ${config.offsetY || -3}px)`,
              filter: `blur(${config.blur || 8}px)`,
              zIndex: 1,
            }}
          >
            {editedContent || "Text"}
          </div>
        );
        break;

      case "hollow":
        layers.push(
          <div
            key="hollow-stroke"
            style={{
              ...baseStyle,
              color: "transparent",
              WebkitTextStroke: `2px ${config.color || "#000000"}`,
              WebkitTextFillColor: "transparent",
              zIndex: 1,
            }}
          >
            {editedContent || "Text"}
          </div>
        );
        break;

      case "outline":
        layers.push(
          <div
            key="outline-stroke"
            style={{
              ...baseStyle,
              color: baseTextColor,
              WebkitTextStroke: `2px ${config.color || "#000000"}`,
              zIndex: 2,
            }}
          >
            {editedContent || "Text"}
          </div>
        );
        break;

      case "echo":
        layers.push(
          <div
            key="echo-layer"
            style={{
              ...baseStyle,
              color: config.color || "#000000",
              opacity: 0.4,
              transform: `translate(${config.offsetX || 2}px, ${config.offsetY || 2}px)`,
              zIndex: 1,
            }}
          >
            {editedContent || "Text"}
          </div>
        );
        break;

      case "glitch":
        layers.push(
          <>
            <div
              key="glitch-1"
              style={{
                ...baseStyle,
                color: config.color || "#000000",
                opacity: 0.5,
                transform: `translate(${config.offsetX || 2}px, 0)`,
                zIndex: 1,
              }}
            >
              {editedContent || "Text"}
            </div>
            <div
              key="glitch-2"
              style={{
                ...baseStyle,
                color: config.color || "#000000",
                opacity: 0.3,
                transform: `translate(-${config.offsetX || 2}px, 0)`,
                zIndex: 1,
              }}
            >
              {editedContent || "Text"}
            </div>
          </>
        );
        break;

      case "neon":
        const neonColor = config.color || "#00ffff";
        layers.push(
          <>
            <div
              key="neon-glow-1"
              style={{
                ...baseStyle,
                color: neonColor,
                opacity: 0.8,
                filter: `blur(${config.blur || 8}px)`,
                zIndex: 1,
              }}
            >
              {editedContent || "Text"}
            </div>
            <div
              key="neon-glow-2"
              style={{
                ...baseStyle,
                color: neonColor,
                opacity: 0.6,
                filter: `blur(${(config.blur || 8) * 1.5}px)`,
                zIndex: 0,
              }}
            >
              {editedContent || "Text"}
            </div>
          </>
        );
        break;

      case "background":
        const bgColor = config.color || "#ffff00";
        layers.push(
          <div
            key="bg-highlight"
            style={{
              ...baseStyle,
              backgroundColor: bgColor,
              opacity: 0.3,
              padding: "2px 4px",
              borderRadius: "4px",
              zIndex: -1,
              transform: "translate(0, 0)",
            }}
          >
            {editedContent || "Text"}
          </div>
        );
        break;
    }

    return <>{layers}</>;
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
            fontStyle: styles.fontStyle || "normal",
            fontFamily: styles.fontFamily || "inherit",
            color: getDefaultTextColor(),
            textAlign: styles.textAlign || "left",
            textDecoration: styles.textDecoration || "none",
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
        <>
          {/* Effect layers (rendered behind base text, absolute positioning) */}
          {renderEffectLayers()}
          
          {/* Base text layer (always on top, normal rendering) */}
          <div
            ref={contentRef}
            style={{
              position: "relative",
              width: "100%",
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
              fontSize: `${styles.fontSize || 16}px`,
              fontWeight: styles.fontWeight || "normal",
              fontStyle: styles.fontStyle || "normal",
              fontFamily: styles.fontFamily || "inherit",
              color: getDefaultTextColor(),
              textAlign: styles.textAlign || "left",
              textDecoration: styles.textDecoration || "none",
              lineHeight: styles.lineHeight || 1.4,
              letterSpacing: styles.letterSpacing !== undefined ? `${styles.letterSpacing}px` : "0px",
              zIndex: 10, // Base text always on top
            }}
          >
            {editedContent || "Text"}
          </div>
        </>
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
