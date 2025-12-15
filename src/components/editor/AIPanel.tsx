"use client";

/**
 * AI Panel - Phase 3.2 UX Layer
 * 
 * Controlled, non-destructive AI interface that:
 * - Requires explicit user intent
 * - Always shows preview before applying
 * - Never mutates editor state automatically
 * - Preserves single-step undo
 */

import { useState, useCallback } from "react";
import type { Block } from "@/types/blocks";
import { useEditorStateStore } from "@/stores/editorStateStore";
import { insertEditorBlocks } from "@/utils/aiBlockHelpers";
import { AIPromptInput } from "./ai/AIPromptInput";
import { AIPreviewRenderer } from "./ai/AIPreviewRenderer";
import { AIActionControls } from "./ai/AIActionControls";

interface AIPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIPanel({ isOpen, onClose }: AIPanelProps) {
  const { blocks, selectedBlockId, startActionGroup, endActionGroup, deleteBlock, addBlock } = useEditorStateStore();
  
  // AI preview state (separate from editor state)
  const [previewBlocks, setPreviewBlocks] = useState<Block[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // Handle AI generation
  const handleGenerate = useCallback(async (prompt: string, options?: {
    tone?: string;
    length?: string;
    sectionType?: string;
  }) => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setPreviewBlocks(null);

    try {
      // Build full prompt with options if provided
      let fullPrompt = prompt;
      if (options?.tone || options?.length || options?.sectionType) {
        const optionsText = [
          options.tone && `Tone: ${options.tone}`,
          options.length && `Length: ${options.length}`,
          options.sectionType && `Section type: ${options.sectionType}`,
        ].filter(Boolean).join(", ");
        fullPrompt = `${prompt}\n\n${optionsText}`;
      }

      const response = await fetch("/api/ai/gateway", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: fullPrompt,
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
          // Schema validation errors
          const errorMessages = errorData.details.map((d: { message: string }) => d.message).join("; ");
          throw new Error(`Validation failed: ${errorMessages}`);
        }
        
        throw new Error(errorData.error || errorData.details || "AI generation failed");
      }

      const data = await response.json();
      
      if (!data.blocks || !Array.isArray(data.blocks) || data.blocks.length === 0) {
        throw new Error("AI returned no blocks");
      }

      // Store preview blocks (these are already translated editor blocks from the gateway)
      setPreviewBlocks(data.blocks);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      setPreviewBlocks(null);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Handle cancel - clear preview state, no side effects
  const handleCancel = useCallback(() => {
    setPreviewBlocks(null);
    setError(null);
    onClose();
  }, [onClose]);

  // Handle insert action (insert at default position)
  const handleInsert = useCallback(() => {
    if (!previewBlocks || previewBlocks.length === 0) return;
    
    setIsApplying(true);
    try {
      // Use helper to insert blocks as one undo operation
      insertEditorBlocks(previewBlocks);
      
      // Clear preview and close
      setPreviewBlocks(null);
      setError(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to insert blocks");
    } finally {
      setIsApplying(false);
    }
  }, [previewBlocks, onClose]);

  // Handle append action (append at end)
  const handleAppend = useCallback(() => {
    if (!previewBlocks || previewBlocks.length === 0) return;
    
    setIsApplying(true);
    try {
      // Calculate position at end of canvas (below existing blocks)
      const existingBlocks = blocks;
      let maxY = 0;
      existingBlocks.forEach(block => {
        const blockBottom = block.position.y + block.size.height;
        if (blockBottom > maxY) {
          maxY = blockBottom;
        }
      });
      
      // Offset preview blocks to append position
      const offsetY = maxY + 50; // 50px spacing
      const offsetBlocks = previewBlocks.map(block => ({
        ...block,
        position: {
          ...block.position,
          y: block.position.y + offsetY,
        },
      }));
      
      // Insert offset blocks
      insertEditorBlocks(offsetBlocks);
      
      // Clear preview and close
      setPreviewBlocks(null);
      setError(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to append blocks");
    } finally {
      setIsApplying(false);
    }
  }, [previewBlocks, blocks, onClose]);

  // Handle replace action (replace selected blocks)
  const handleReplace = useCallback(() => {
    if (!previewBlocks || previewBlocks.length === 0) return;
    if (!selectedBlockId) {
      setError("Please select a block to replace");
      return;
    }
    
    setIsApplying(true);
    try {
      // Start action group (all operations grouped as one undo step)
      startActionGroup();
      
      // Delete selected block
      deleteBlock(selectedBlockId);
      
      // Insert preview blocks (they're already translated editor blocks)
      previewBlocks.forEach(block => {
        addBlock(block);
      });
      
      // End action group (pushes to history as one operation)
      endActionGroup();
      
      // Clear preview and close
      setPreviewBlocks(null);
      setError(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to replace blocks");
    } finally {
      setIsApplying(false);
    }
  }, [previewBlocks, selectedBlockId, startActionGroup, endActionGroup, deleteBlock, addBlock, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-full max-h-[90vh] w-full max-w-6xl flex-col rounded-lg border border-zinc-300 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Generate with AI
          </h2>
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
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Prompt Input */}
          <div className="flex w-80 flex-col border-r border-zinc-200 dark:border-zinc-800">
            <div className="flex-1 overflow-y-auto p-4">
              <AIPromptInput
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                disabled={isApplying}
              />
            </div>
            
            {/* Error Display */}
            {error && (
              <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300">
                  {error}
                </div>
              </div>
            )}
          </div>

          {/* Right: Preview */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {isGenerating ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-400"></div>
                  <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                    Generating content...
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
                  <AIActionControls
                    onInsert={handleInsert}
                    onAppend={handleAppend}
                    onReplace={handleReplace}
                    onCancel={handleCancel}
                    canReplace={!!selectedBlockId}
                    disabled={isApplying}
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-center">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    AI Preview
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Enter a prompt and generate content to see a preview here
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
