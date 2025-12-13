"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useEditorStore } from "@/stores/editorStore";
import { useEditorStateStore } from "@/stores/editorStateStore";
import { deserializeBlocks, serializeBlocks } from "@/utils/blockSerialization";
import { EditorErrorBoundary } from "./EditorErrorBoundary";
import { EditorTopBar } from "./EditorTopBar";
import { EditorSidebar } from "./EditorSidebar";
import { EditorCanvasWrapper } from "./EditorCanvasWrapper";
import { EditorPropertiesPanel } from "./EditorPropertiesPanel";

interface Newsletter {
  _id: string;
  title: string;
  description?: string;
  status?: string;
  blocks?: unknown[];
  structureJSON?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

interface EditorLayoutProps {
  newsletterId: string;
}

export function EditorLayout({ newsletterId }: EditorLayoutProps) {
  const router = useRouter();
  const {
    lifecycleState,
    setLifecycleState,
    setNewsletterId,
    isDirty,
    isSaving,
    setSaving,
    setLastSaved,
    reset,
  } = useEditorStore();

  const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedRef = useRef(false);
  const isInitialLoadRef = useRef(true);

  const { blocks, setBlocks } = useEditorStateStore();
  const { setDirty } = useEditorStore();

  // Initialize editor lifecycle
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    setNewsletterId(newsletterId);
    setLifecycleState("loading");

    async function loadNewsletter() {
      try {
        const response = await fetch(`/api/newsletters/${newsletterId}`);

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (response.status === 404) {
          setLifecycleState("error");
          return;
        }

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to load newsletter");
        }

        const data = await response.json();
        setNewsletter(data.newsletter);
        
        // Load blocks into editor state
        if (data.newsletter.blocks && Array.isArray(data.newsletter.blocks)) {
          const deserializedBlocks = deserializeBlocks(data.newsletter.blocks);
          setBlocks(deserializedBlocks);
        }
        
        setLifecycleState("ready");
        isInitialLoadRef.current = false;
      } catch (err) {
        console.error("Failed to load newsletter:", err);
        setLifecycleState("error");
      }
    }

    loadNewsletter();
  }, [newsletterId, router, setNewsletterId, setLifecycleState]);

  // Watch for block changes and mark as dirty
  useEffect(() => {
    if (isInitialLoadRef.current || lifecycleState !== "ready") {
      return;
    }

    setDirty(true);
  }, [blocks, lifecycleState, setDirty]);

  // Autosave with debounce (2 seconds after last change)
  const performAutosave = useCallback(async () => {
    if (!isDirty || isSaving || lifecycleState !== "ready") {
      return;
    }

    try {
      setSaving(true);

      const serializedBlocks = serializeBlocks(blocks);

      const response = await fetch(`/api/newsletters/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: newsletterId,
          blocks: serializedBlocks,
          structureJSON: newsletter?.structureJSON || {},
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLastSaved(new Date());
        setDirty(false);
        if (data.updated) {
          setNewsletter(data.updated);
        }
      }
    } catch (err) {
      console.error("Autosave failed:", err);
    } finally {
      setSaving(false);
    }
  }, [blocks, isDirty, isSaving, lifecycleState, newsletterId, newsletter?.structureJSON, setSaving, setLastSaved, setDirty]);

  // Debounced autosave
  useEffect(() => {
    if (lifecycleState !== "ready" || !isDirty || isInitialLoadRef.current) {
      return;
    }

    // Clear existing timeout
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    // Set new timeout (2 seconds debounce)
    autosaveTimeoutRef.current = setTimeout(() => {
      performAutosave();
    }, 2000);

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [blocks, lifecycleState, isDirty, performAutosave]);

  // Warn before unload if there are unsaved changes
  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  // Handle title change
  const handleTitleChange = useCallback(async (newTitle: string) => {
    if (!newsletter || newTitle === newsletter.title) {
      return;
    }

    try {
      const response = await fetch(`/api/newsletters/${newsletterId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: newTitle }),
      });

      if (response.ok) {
        const data = await response.json();
        setNewsletter(data.newsletter);
      }
    } catch (err) {
      console.error("Failed to update title:", err);
    }
  }, [newsletter, newsletterId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
      reset();
    };
  }, [reset]);

  // Loading state
  if (lifecycleState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-400"></div>
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Loading newsletter...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (lifecycleState === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-6 dark:bg-zinc-950">
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/20">
          <h2 className="mb-2 text-xl font-semibold text-red-900 dark:text-red-400">
            Newsletter Not Found
          </h2>
          <p className="mb-6 text-sm text-red-700 dark:text-red-300">
            The newsletter you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              onClick={() => {
                hasInitializedRef.current = false;
                setLifecycleState("loading");
                window.location.reload();
              }}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
            >
              Retry
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-700 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Ready state - render the layout
  return (
    <EditorErrorBoundary newsletterId={newsletterId}>
      <div className="flex h-screen flex-col overflow-hidden bg-white dark:bg-zinc-950">
        {/* Top toolbar */}
        <EditorTopBar
          newsletterTitle={newsletter?.title}
          onTitleChange={handleTitleChange}
        />

        {/* Main content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar */}
          <EditorSidebar />

          {/* Center canvas wrapper */}
          <EditorCanvasWrapper />

          {/* Right properties panel */}
          <EditorPropertiesPanel />
        </div>

        {/* Floating overlay layer for future selection toolbars */}
        <div className="pointer-events-none fixed inset-0 z-50">
          {/* This layer will be used for floating UI elements like selection toolbars */}
        </div>
      </div>
    </EditorErrorBoundary>
  );
}
