"use client";

/**
 * Section AI Panel - Phase 3.3.1
 * 
 * Section-scoped AI interface that operates only on selected container sections.
 * - Requires explicit user intent
 * - Always shows preview before applying
 * - Never mutates editor state automatically
 * - Preserves single-step undo
 * - Only affects the selected section
 */

import { useState, useCallback, useEffect } from "react";
import type { Block, ContainerBlock, TextBlock } from "@/types/blocks";
import { useEditorStateStore } from "@/stores/editorStateStore";
import { getSectionBlocks, extractSectionContentForPrompt } from "@/utils/sectionAIHelpers";
import { buildSectionAIPrompt, type SectionAIAction } from "@/services/sectionAIPrompts";
import { AIPreviewRenderer } from "./ai/AIPreviewRenderer";
import { AIActionControls } from "./ai/AIActionControls";

interface SectionAIPanelProps {
  isOpen: boolean;
  containerBlock: ContainerBlock | null;
  textBlock: TextBlock | null;
  action: string;
  onClose: () => void;
}

export function SectionAIPanel({ isOpen, containerBlock, textBlock, action, onClose }: SectionAIPanelProps) {
  const { blocks } = useEditorStateStore();
  
  // Get all blocks in this section (container + children, or just the text block)
  const sectionBlocks = containerBlock 
    ? getSectionBlocks(containerBlock.id, blocks)
    : textBlock
    ? [textBlock]
    : [];
  
  const sectionContent = extractSectionContentForPrompt(
    sectionBlocks, 
    containerBlock || undefined
  );
  
  // AI preview state (separate from editor state)
  const [previewBlocks, setPreviewBlocks] = useState<Block[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // Handle AI generation
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    setPreviewBlocks(null);

    try {
      // Build section-specific prompt
      const prompt = buildSectionAIPrompt(action as SectionAIAction, sectionContent);

      const response = await fetch("/api/ai/gateway", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          operation: "generate_blocks",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 429) {
          const resetAt = errorData.resetAt ? new Date(errorData.resetAt) : null;
          const resetTime = resetAt ? resetAt.toLocaleTimeString() : "soon";
          throw new Error(`Rate limit exceeded. Try again after ${resetTime}.`);
        }
        
        if (response.status === 400 && errorData.details) {
          const errorMessages = errorData.details.map((d: { message: string }) => d.message).join("; ");
          throw new Error(`Validation failed: ${errorMessages}`);
        }
        
        throw new Error(errorData.error || errorData.details || "AI generation failed");
      }

      const data = await response.json();
      
      if (!data.blocks || !Array.isArray(data.blocks) || data.blocks.length === 0) {
        throw new Error("AI returned no blocks");
      }

      // Store preview blocks (already translated editor blocks from gateway)
      setPreviewBlocks(data.blocks);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      setPreviewBlocks(null);
    } finally {
      setIsGenerating(false);
    }
  }, [action, sectionContent]);

  // Auto-generate on open
  useEffect(() => {
    if (isOpen && !previewBlocks && !isGenerating && !error) {
      handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Handle cancel - clear preview state, no side effects
  const handleCancel = useCallback(() => {
    setPreviewBlocks(null);
    setError(null);
    onClose();
  }, [onClose]);

  // Handle replace action (replace section blocks only)
  const handleReplace = useCallback(() => {
    if (!previewBlocks || previewBlocks.length === 0) return;
    
    setIsApplying(true);
    try {
      const store = useEditorStateStore.getState();
      
      // Get current blocks from store (to ensure we have latest state)
      const currentBlocks = store.blocks;
      
      // Get all block IDs in this section (container + all children, or just the text block)
      const currentSectionBlocks = containerBlock
        ? getSectionBlocks(containerBlock.id, currentBlocks)
        : textBlock
        ? [textBlock]
        : [];
      const sectionBlockIds = currentSectionBlocks.map(b => b.id);
      
      // Start action group (all operations grouped as one undo step)
      store.startActionGroup();
      
      // Delete all section blocks (including container)
      sectionBlockIds.forEach(id => {
        store.deleteBlock(id);
      });
      
      // Insert preview blocks (they're already translated editor blocks)
      previewBlocks.forEach(block => {
        store.addBlock(block);
      });
      
      // End action group (pushes to history as one operation)
      store.endActionGroup();
      
      // Clear preview and close
      setPreviewBlocks(null);
      setError(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to replace section");
    } finally {
      setIsApplying(false);
    }
  }, [previewBlocks, containerBlock, textBlock, onClose]);

  if (!isOpen) return null;

  const actionLabels: Record<string, string> = {
    rewrite: "Rewrite",
    shorten: "Shorten",
    expand: "Expand",
    improve_clarity: "Improve Clarity",
    make_persuasive: "Make Persuasive",
    change_tone: "Change Tone",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-full max-h-[90vh] w-full max-w-6xl flex-col rounded-lg border border-zinc-300 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              AI: {actionLabels[action] || action}
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {containerBlock ? "Section" : "Text block"}-only modification ({sectionBlocks.length} {sectionBlocks.length === 1 ? "block" : "blocks"})
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="rounded p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Error Display */}
          {error && (
            <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300">
                {error}
                <button
                  onClick={handleGenerate}
                  className="ml-2 underline"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Preview Area */}
          {isGenerating ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-400"></div>
                <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                  Generating {actionLabels[action] || action}...
                </p>
              </div>
            </div>
          ) : previewBlocks ? (
            <>
              <div className="flex-1 overflow-auto p-6">
                <AIPreviewRenderer blocks={previewBlocks} />
              </div>
              
              {/* Action Controls */}
              <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    <p className="font-medium">Replace section?</p>
                    <p className="text-xs">All changes can be undone with a single undo step</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleReplace}
                      disabled={isApplying}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:bg-blue-500 dark:hover:bg-blue-600 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-400"
                      title="Replace section with AI-generated content"
                    >
                      Replace Section
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isApplying}
                      className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500"
                      title="Cancel - discard preview"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-center">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  No preview available
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {error ? "Generation failed" : "Generating preview..."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
