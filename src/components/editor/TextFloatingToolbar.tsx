"use client";

import { useEffect, useState, useRef } from "react";
import { useEditorStateStore } from "@/stores/editorStateStore";
import { isTextBlock, type TextBlock } from "@/types/blocks";

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 800;
const TOOLBAR_OFFSET = 12; // Offset above block in pixels

// Font allowlist (from schema)
const FONT_FAMILIES = [
  "system-ui",
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Georgia",
  "Courier New",
  "Verdana",
] as const;

// Recent colors storage (localStorage key)
const RECENT_COLORS_KEY = "newly-recent-colors";
const MAX_RECENT_COLORS = 8;

function getRecentColors(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RECENT_COLORS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentColor(color: string): void {
  if (typeof window === "undefined") return;
  try {
    const recent = getRecentColors();
    const filtered = recent.filter((c) => c !== color);
    const updated = [color, ...filtered].slice(0, MAX_RECENT_COLORS);
    localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(updated));
  } catch {
    // Silently fail
  }
}

function transformTextCase(text: string, caseType: "uppercase" | "lowercase" | "title"): string {
  switch (caseType) {
    case "uppercase":
      return text.toUpperCase();
    case "lowercase":
      return text.toLowerCase();
    case "title":
      return text
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
    default:
      return text;
  }
}

export function TextFloatingToolbar() {
  const {
    getSelectedBlock,
    zoomLevel,
    updateBlockStyles,
    updateBlock,
    editorMode,
  } = useEditorStateStore();

  const selectedBlock = getSelectedBlock();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [recentColors, setRecentColors] = useState<string[]>(getRecentColors());
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showEffects, setShowEffects] = useState(false);
  const [showTextCaseMenu, setShowTextCaseMenu] = useState(false);
  const [showPositionMenu, setShowPositionMenu] = useState(false);

  // Only show for text blocks, hide during dragging/resizing or text editing
  const isTextBlockSelected = selectedBlock && isTextBlock(selectedBlock);
  const shouldShow = isTextBlockSelected && editorMode === "idle";

  // Calculate toolbar position relative to selected block
  useEffect(() => {
    if (!shouldShow || !selectedBlock || !isTextBlock(selectedBlock)) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      // Find the actual block element in the DOM using data attribute
      const blockElement = document.querySelector(`[data-block-id="${selectedBlock.id}"]`) as HTMLElement;
      if (!blockElement) {
        // Retry after a short delay if block not found yet
        setTimeout(updatePosition, 50);
        return;
      }

      // Get the block's bounding rect (already accounts for zoom/transform)
      const blockRect = blockElement.getBoundingClientRect();

      // Wait for toolbar to render to get its dimensions
      if (!toolbarRef.current) {
        requestAnimationFrame(updatePosition);
        return;
      }

      const toolbarWidth = toolbarRef.current.offsetWidth;
      const toolbarHeight = toolbarRef.current.offsetHeight;

      // Position toolbar above block, perfectly centered horizontally (like Canva)
      const blockCenterX = blockRect.left + blockRect.width / 2;
      const x = blockCenterX - toolbarWidth / 2;
      const y = blockRect.top - toolbarHeight - TOOLBAR_OFFSET;
      
      // Ensure toolbar is centered on block, not constrained too early
      // Only constrain if it would go off-screen

      // Constrain to viewport (but prefer centered position)
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const minX = 8;
      const maxX = viewportWidth - toolbarWidth - 8;
      
      // Only constrain X if it would go off-screen, otherwise keep centered
      let constrainedX = x;
      if (x < minX) {
        constrainedX = minX;
      } else if (x > maxX) {
        constrainedX = maxX;
      }
      
      const constrainedY = Math.max(8, Math.min(y, viewportHeight - toolbarHeight - 8));

      setPosition({ x: constrainedX, y: constrainedY });
    };

    // Initial position update
    updatePosition();

    // Update on scroll, resize, zoom change, and block position changes
    const handleUpdate = () => {
      requestAnimationFrame(updatePosition);
    };

    window.addEventListener("scroll", handleUpdate, true);
    window.addEventListener("resize", handleUpdate);
    
    // Use MutationObserver to detect block position changes
    const observer = new MutationObserver(handleUpdate);
    const canvasElement = document.querySelector('[class*="relative rounded-lg border"]');
    if (canvasElement) {
      observer.observe(canvasElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style"],
      });
    }

    // Also update periodically for smooth repositioning during drag/resize
    const interval = setInterval(handleUpdate, 50);

    return () => {
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("resize", handleUpdate);
      observer.disconnect();
      clearInterval(interval);
    };
  }, [shouldShow, selectedBlock, zoomLevel, editorMode]);

  if (!shouldShow || !selectedBlock || !isTextBlock(selectedBlock)) {
    return null;
  }

  // Show toolbar even if position is still calculating (will update when ready)
  if (!position) {
    return (
      <div
        ref={toolbarRef}
        className="fixed z-[100] opacity-0 pointer-events-none"
        style={{ left: "-9999px", top: "-9999px" }}
      />
    );
  }

  const block = selectedBlock;
  const styles = block.styles;

  const handleFontSizeChange = (delta: number) => {
    const currentSize = styles.fontSize || 16;
    const newSize = Math.max(8, Math.min(72, currentSize + delta));
    updateBlockStyles(block.id, { fontSize: newSize });
  };

  const handleColorChange = (color: string) => {
    updateBlockStyles(block.id, { color });
    addRecentColor(color);
    setRecentColors(getRecentColors());
    setShowColorPicker(false);
  };

  const handleTextCase = (caseType: "uppercase" | "lowercase" | "title") => {
    const transformed = transformTextCase(block.content, caseType);
    updateBlock(block.id, { content: transformed });
  };

  const handleZIndexChange = (delta: number) => {
    const newZIndex = Math.max(1, Math.min(1000, block.zIndex + delta));
    updateBlock(block.id, { zIndex: newZIndex });
  };

  return (
    <div
      ref={toolbarRef}
      className="fixed z-[100] rounded-lg border border-zinc-300 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        pointerEvents: "auto",
        transform: "translateZ(0)", // Force hardware acceleration
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-0.5 px-1.5 py-1">
        {/* 1. Font Family */}
        <select
          value={styles.fontFamily || "system-ui"}
          onChange={(e) => updateBlockStyles(block.id, { fontFamily: e.target.value })}
          className="h-7 rounded border border-zinc-300 bg-white px-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          onClick={(e) => e.stopPropagation()}
          style={{ minWidth: "100px" }}
        >
          {FONT_FAMILIES.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>

        {/* Divider */}
        <div className="h-5 w-px bg-zinc-300 dark:bg-zinc-700" />

        {/* 2. Font Size */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleFontSizeChange(-1)}
            className="flex h-7 w-7 items-center justify-center rounded text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            title="Decrease font size"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <input
            type="number"
            value={styles.fontSize || 16}
            onChange={(e) => {
              const size = parseInt(e.target.value) || 16;
              updateBlockStyles(block.id, { fontSize: Math.max(8, Math.min(72, size)) });
            }}
            className="h-7 w-10 rounded border border-zinc-300 bg-white px-1 text-center text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            min="8"
            max="72"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => handleFontSizeChange(1)}
            className="flex h-7 w-7 items-center justify-center rounded text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            title="Increase font size"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-zinc-300 dark:bg-zinc-700" />

        {/* 3. Text Emphasis */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() =>
              updateBlockStyles(block.id, {
                fontWeight: styles.fontWeight === "bold" || styles.fontWeight === 700 ? "normal" : "bold",
              })
            }
            className={`flex h-7 w-7 items-center justify-center rounded text-xs font-bold ${
              styles.fontWeight === "bold" || styles.fontWeight === 700
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
            title="Bold"
          >
            B
          </button>
          <button
            onClick={() =>
              updateBlockStyles(block.id, {
                fontStyle: styles.fontStyle === "italic" ? "normal" : "italic",
              })
            }
            className={`flex h-7 w-7 items-center justify-center rounded text-xs italic ${
              styles.fontStyle === "italic"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
            title="Italic"
          >
            I
          </button>
          <button
            onClick={() =>
              updateBlockStyles(block.id, {
                textDecoration: styles.textDecoration === "underline" ? "none" : "underline",
              })
            }
            className={`flex h-7 w-7 items-center justify-center rounded text-xs ${
              styles.textDecoration === "underline"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
            title="Underline"
          >
            <span className="underline">U</span>
          </button>
          <button
            onClick={() =>
              updateBlockStyles(block.id, {
                textDecoration: styles.textDecoration === "line-through" ? "none" : "line-through",
              })
            }
            className={`flex h-7 w-7 items-center justify-center rounded text-xs ${
              styles.textDecoration === "line-through"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
            title="Strikethrough"
          >
            <span className="line-through">S</span>
          </button>
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-zinc-300 dark:bg-zinc-700" />

        {/* 4. Text Color */}
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="flex h-7 w-7 items-center justify-center rounded border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            title="Text color"
          >
            <div
              className="h-4 w-4 rounded"
              style={{ backgroundColor: styles.color || "#000000" }}
            />
          </button>
          {showColorPicker && (
            <div className="absolute left-0 top-8 z-10 rounded-lg border border-zinc-300 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              <div className="mb-2 grid grid-cols-8 gap-1">
                {recentColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className="h-6 w-6 rounded border border-zinc-300 dark:border-zinc-700"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <input
                type="color"
                value={styles.color || "#000000"}
                onChange={(e) => handleColorChange(e.target.value)}
                className="h-8 w-full rounded border border-zinc-300 dark:border-zinc-700"
              />
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-zinc-300 dark:bg-zinc-700" />

        {/* 5. Text Case */}
        <div className="relative">
          <button
            onClick={() => setShowTextCaseMenu(!showTextCaseMenu)}
            className="flex h-7 items-center gap-1 rounded px-2 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            title="Text case"
          >
            Aa
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showTextCaseMenu && (
            <div className="absolute left-0 top-8 z-10 rounded-lg border border-zinc-300 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              <button
                onClick={() => {
                  handleTextCase("uppercase");
                  setShowTextCaseMenu(false);
                }}
                className="block w-full px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                UPPERCASE
              </button>
              <button
                onClick={() => {
                  handleTextCase("lowercase");
                  setShowTextCaseMenu(false);
                }}
                className="block w-full px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                lowercase
              </button>
              <button
                onClick={() => {
                  handleTextCase("title");
                  setShowTextCaseMenu(false);
                }}
                className="block w-full px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Title Case
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-zinc-300 dark:bg-zinc-700" />

        {/* 6. Text Alignment - Single cycling button */}
        <button
          onClick={() => {
            const alignments: ("left" | "center" | "right" | "justify")[] = ["left", "center", "right", "justify"];
            const currentAlign = styles.textAlign || "left";
            const currentIndex = alignments.indexOf(currentAlign);
            const nextIndex = (currentIndex + 1) % alignments.length;
            updateBlockStyles(block.id, { textAlign: alignments[nextIndex] });
          }}
          className="flex h-7 w-7 items-center justify-center rounded text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          title={`Align ${styles.textAlign || "left"} (click to cycle)`}
        >
          {styles.textAlign === "left" && (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h8" />
            </svg>
          )}
          {styles.textAlign === "center" && (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
          {styles.textAlign === "right" && (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-8 6h8" />
            </svg>
          )}
          {(styles.textAlign === "justify" || !styles.textAlign) && (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {/* Divider */}
        <div className="h-5 w-px bg-zinc-300 dark:bg-zinc-700" />

        {/* 7. Line Height */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-zinc-600 dark:text-zinc-400">LH</span>
          <input
            type="number"
            step="0.1"
            value={styles.lineHeight || 1.4}
            onChange={(e) => {
              const lh = parseFloat(e.target.value) || 1.4;
              updateBlockStyles(block.id, { lineHeight: Math.max(1.2, Math.min(2.5, lh)) });
            }}
            className="h-7 w-12 rounded border border-zinc-300 bg-white px-1 text-center text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            min="1.2"
            max="2.5"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-zinc-300 dark:bg-zinc-700" />

        {/* 8. Letter Spacing */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-zinc-600 dark:text-zinc-400">LS</span>
          <input
            type="number"
            step="0.1"
            value={styles.letterSpacing ?? 0}
            onChange={(e) => {
              const ls = parseFloat(e.target.value) || 0;
              updateBlockStyles(block.id, { letterSpacing: Math.max(-1, Math.min(10, ls)) });
            }}
            className="h-7 w-12 rounded border border-zinc-300 bg-white px-1 text-center text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            min="-1"
            max="10"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-zinc-300 dark:bg-zinc-700" />

        {/* 9. Effects Button - Opens effects panel in sidebar */}
        <button
          onClick={() => {
            // Effects are handled in the sidebar TextProperties panel
            // This button could scroll to effects section or show a tooltip
            // For now, just a placeholder that doesn't break functionality
            setShowEffects(false);
          }}
          className="flex h-7 items-center gap-1 rounded px-2 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          title="Text effects (see sidebar)"
        >
          Effects
        </button>

        {/* Divider */}
        <div className="h-5 w-px bg-zinc-300 dark:bg-zinc-700" />

        {/* 10. Position Menu */}
        <div className="relative">
          <button
            onClick={() => setShowPositionMenu(!showPositionMenu)}
            className="flex h-7 items-center gap-1 rounded px-2 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            title="Position"
          >
            Position
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showPositionMenu && (
            <div className="absolute right-0 top-8 z-10 rounded-lg border border-zinc-300 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              <button
                onClick={() => {
                  handleZIndexChange(1);
                  setShowPositionMenu(false);
                }}
                className="block w-full px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Bring Forward
              </button>
              <button
                onClick={() => {
                  handleZIndexChange(-1);
                  setShowPositionMenu(false);
                }}
                className="block w-full px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Send Backward
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {showColorPicker && (
        <div
          className="fixed inset-0 z-[99]"
          onClick={() => setShowColorPicker(false)}
        />
      )}
      {showEffects && (
        <div
          className="fixed inset-0 z-[99]"
          onClick={() => setShowEffects(false)}
        />
      )}
      {showTextCaseMenu && (
        <div
          className="fixed inset-0 z-[99]"
          onClick={() => setShowTextCaseMenu(false)}
        />
      )}
      {showPositionMenu && (
        <div
          className="fixed inset-0 z-[99]"
          onClick={() => setShowPositionMenu(false)}
        />
      )}
    </div>
  );
}
