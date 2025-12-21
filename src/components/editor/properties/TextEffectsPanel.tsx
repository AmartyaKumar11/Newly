"use client";

import type { TextBlock, TextEffect } from "@/types/blocks";
import { useEditorStateStore } from "@/stores/editorStateStore";

interface TextEffectsPanelProps {
  block: TextBlock;
}

// Preset effect definitions
const EFFECT_PRESETS: Array<{
  type: TextEffect["type"];
  label: string;
  preview: string; // Simple text preview
}> = [
  { type: "none", label: "None", preview: "Aa" },
  { type: "shadow", label: "Shadow", preview: "Aa" },
  { type: "lift", label: "Lift", preview: "Aa" },
  { type: "hollow", label: "Hollow", preview: "Aa" },
  { type: "outline", label: "Outline", preview: "Aa" },
  { type: "echo", label: "Echo", preview: "Aa" },
  { type: "glitch", label: "Glitch", preview: "Aa" },
  { type: "neon", label: "Neon", preview: "Aa" },
  { type: "background", label: "Background", preview: "Aa" },
];

export function TextEffectsPanel({ block }: TextEffectsPanelProps) {
  const { updateBlockStyles } = useEditorStateStore();
  const currentEffect = block.styles.textEffect?.type || "none";

  const handleEffectSelect = (effectType: TextEffect["type"]) => {
    // Create the new effect object
    const newEffect: TextEffect = effectType === "none" 
      ? { type: "none" }
      : { type: effectType };

    // Update through store (creates one undo step automatically)
    updateBlockStyles(block.id, {
      textEffect: newEffect,
    });
  };

  // Get preview style for each preset
  const getPreviewStyle = (effectType: TextEffect["type"]): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      fontSize: "18px",
      fontWeight: "600",
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#000000",
    };

    switch (effectType) {
      case "none":
        return baseStyle;
      case "shadow":
        return {
          ...baseStyle,
          textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
        };
      case "lift":
        return {
          ...baseStyle,
          textShadow: "0 -3px 8px rgba(0,0,0,0.3)",
        };
      case "hollow":
        return {
          ...baseStyle,
          color: "transparent",
          WebkitTextStroke: "2px #000000",
        };
      case "outline":
        return {
          ...baseStyle,
          WebkitTextStroke: "2px #000000",
        };
      case "echo":
        return {
          ...baseStyle,
          textShadow: "2px 2px 0 rgba(0,0,0,0.4)",
        };
      case "glitch":
        return {
          ...baseStyle,
          textShadow: "2px 0 0 #ff0000, -2px 0 0 #00ffff",
        };
      case "neon":
        return {
          ...baseStyle,
          color: "#00ffff",
          textShadow: "0 0 8px #00ffff, 0 0 12px #00ffff",
        };
      case "background":
        return {
          ...baseStyle,
          backgroundColor: "#ffff00",
          opacity: 0.3,
          padding: "2px 8px",
          borderRadius: "4px",
        };
      default:
        return baseStyle;
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Text Effects</h3>
      
      {/* Preset Grid */}
      <div className="grid grid-cols-3 gap-2">
        {EFFECT_PRESETS.map((preset) => {
          const isActive = currentEffect === preset.type;
          return (
            <button
              key={preset.type}
              onClick={() => handleEffectSelect(preset.type)}
              className={`relative flex h-16 flex-col items-center justify-center rounded-lg border-2 transition cursor-pointer ${
                isActive
                  ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/20"
                  : "border-zinc-300 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600"
              }`}
              title={preset.label}
            >
              {/* Preview */}
              <div
                style={getPreviewStyle(preset.type)}
                className="pointer-events-none"
              >
                {preset.preview}
              </div>
              
              {/* Label */}
              <span
                className={`mt-1 text-xs font-medium ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {preset.label}
              </span>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute right-1 top-1 h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
