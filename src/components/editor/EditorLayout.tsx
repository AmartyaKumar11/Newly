"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEditorStore } from "@/stores/editorStore";
import { useEditorStateStore } from "@/stores/editorStateStore";
import { deserializeBlocks, serializeBlocks } from "@/utils/blockSerialization";
import { EditorErrorBoundary } from "./EditorErrorBoundary";
import { EditorTopBar } from "./EditorTopBar";
import { EditorSidebar } from "./EditorSidebar";
import { EditorCanvasWrapper } from "./EditorCanvasWrapper";
import { EditorPropertiesPanel } from "./EditorPropertiesPanel";
import { AIPanel } from "./AIPanel";
import { TextFloatingToolbar } from "./TextFloatingToolbar";
import { PositionSidebarWrapper } from "./PositionSidebarWrapper";
import { TextEffectsPanelWrapper } from "./TextEffectsPanelWrapper";
import { usePresence } from "@/hooks/usePresence";
import { PresenceIndicator } from "@/components/presence/PresenceIndicator";
import { PresenceCursors } from "@/components/presence/PresenceCursors";
import type { AccessRole } from "@/types/access";
import { useLiveEditing } from "@/hooks/useLiveEditing";
import { LiveEditingProvider } from "@/contexts/LiveEditingContext";

interface Newsletter {
  _id: string;
  title: string;
  description?: string;
  status?: string;
  blocks?: unknown[];
  structureJSON?: Record<string, unknown>;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

interface EditorLayoutProps {
  newsletterId: string;
  editorMode?: "edit" | "view"; // Default: "edit", "view" = read-only viewer mode
  initialNewsletter?: Newsletter | null; // Optional: pre-loaded newsletter data (for viewer mode)
  isOwner?: boolean; // Default: true, false for share link access (viewer/editor roles)
  shareToken?: string | null; // Optional: share token for editor role access (for autosave)
}

export function EditorLayout({ newsletterId, editorMode: propEditorMode = "edit", initialNewsletter, isOwner = true, shareToken = null }: EditorLayoutProps) {
  const router = useRouter();
  const { data: session } = useSession();
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
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  const blocksHashRef = useRef<string>("");
  const isSavingRef = useRef(false);

  const { blocks, setBlocks } = useEditorStateStore();
  const { setDirty } = useEditorStore();

  // Determine role for presence (must be before usePresence hook)
  const isViewerMode = propEditorMode === "view";
  // If accessing via share link (isOwner=false), use "editor" or "viewer" based on mode
  // Otherwise, user is owner
  const presenceRole: AccessRole = isOwner ? "owner" : (isViewerMode ? "viewer" : "editor");
  
  // Initialize presence (Phase 4.0: Collaboration Foundations)
  // MUST be called before any conditional returns (Rules of Hooks)
  // Presence is isolated from editor state and does not mutate content
  const presence = usePresence({
    newsletterId,
    userId: session?.user?.id || null,
    role: presenceRole,
    userDisplayName: session?.user?.name || undefined,
    enabled: lifecycleState === "ready", // Only enable when editor is ready
  });

  // Initialize live editing (Phase 4.1: Live Editing)
  // MUST be called before any conditional returns (Rules of Hooks)
  // Live editing enables real-time collaborative mutations
  const liveEditing = useLiveEditing({
    newsletterId,
    userId: session?.user?.id || null,
    role: presenceRole,
    enabled: lifecycleState === "ready" && !isViewerMode, // Only enable when ready and not in viewer mode
  });

  // Initialize editor lifecycle
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    setNewsletterId(newsletterId);
    setLifecycleState("loading");

    async function loadNewsletter() {
      try {
        // Share link mode (viewer or editor): use pre-loaded newsletter data (no auth required)
        if (initialNewsletter) {
          setNewsletter(initialNewsletter);
          
          // Load blocks into editor state
          if (initialNewsletter.blocks && Array.isArray(initialNewsletter.blocks)) {
            const deserializedBlocks = deserializeBlocks(initialNewsletter.blocks);
            setBlocks(deserializedBlocks);
          }
          
          setLifecycleState("ready");
          isInitialLoadRef.current = false;
          
          // Initialize live editing state on server (for editor role)
          if (!isViewerMode && liveEditing.isConnected) {
            // Server will initialize authoritative state when mutation:init is received
          }
          return;
        }

        // Owner edit mode: load via authenticated API
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
        
        // Initialize live editing state on server (when connected)
        if (liveEditing.isConnected) {
          // Server will initialize authoritative state when mutation:init is received
        }
      } catch (err) {
        console.error("Failed to load newsletter:", err);
        setLifecycleState("error");
      }
    }

    loadNewsletter();
  }, [newsletterId, router, setNewsletterId, setLifecycleState, propEditorMode, initialNewsletter]);

  // Watch for block changes and mark as dirty (using hash to prevent unnecessary updates)
  // DISABLED in viewer mode - no autosave allowed
  useEffect(() => {
    if (propEditorMode === "view") return; // Viewer mode: no autosave
    if (isInitialLoadRef.current || lifecycleState !== "ready") {
      return;
    }

    // Create hash of blocks to detect actual changes
    const blocksHash = JSON.stringify(blocks);
    
    // Only mark dirty if blocks actually changed
    if (blocksHash !== blocksHashRef.current) {
      blocksHashRef.current = blocksHash;
      setDirty(true);
    }
  }, [blocks, lifecycleState, setDirty, propEditorMode]);

  // Autosave with debounce (2 seconds after last change)
  // DISABLED in viewer mode - no mutations allowed
  const performAutosave = useCallback(async () => {
    // Viewer mode: no autosave
    if (propEditorMode === "view") return;
    
    // Prevent concurrent saves
    if (isSavingRef.current || !isDirty || isSaving || lifecycleState !== "ready") {
      return;
    }

    // Capture current blocks hash to ensure we're saving the latest state
    const currentHash = blocksHashRef.current;
    const blocksToSave = blocks;

    try {
      isSavingRef.current = true;
      setSaving(true);

      const serializedBlocks = serializeBlocks(blocksToSave);

      // Use share token endpoint if accessing via share link (editor role)
      // Otherwise use authenticated owner endpoint
      const updateUrl = shareToken 
        ? `/api/shares/${shareToken}/update`
        : `/api/newsletters/update`;

      const requestBody = shareToken
        ? {
            blocks: serializedBlocks,
            structureJSON: newsletter?.structureJSON || {},
          }
        : {
            id: newsletterId,
            blocks: serializedBlocks,
            structureJSON: newsletter?.structureJSON || {},
          };

      const response = await fetch(updateUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Only clear dirty if hash hasn't changed during save (last write wins)
        if (blocksHashRef.current === currentHash) {
          setLastSaved(new Date());
          setDirty(false);
          if (data.updated) {
            setNewsletter(data.updated);
          }
        } else {
          // Blocks changed during save, mark dirty again to trigger another save
          setDirty(true);
        }
      }
    } catch (err) {
      console.error("Autosave failed:", err);
      // Don't clear dirty flag on error - will retry
    } finally {
      isSavingRef.current = false;
      setSaving(false);
    }
  }, [blocks, isDirty, isSaving, lifecycleState, newsletterId, newsletter?.structureJSON, setSaving, setLastSaved, setDirty, propEditorMode, shareToken]);

  // Debounced autosave (using hash to prevent unnecessary triggers)
  // DISABLED in viewer mode - no mutations allowed
  useEffect(() => {
    if (propEditorMode === "view") return; // Viewer mode: no autosave
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
  }, [blocksHashRef.current, lifecycleState, isDirty, performAutosave]);

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
  // Viewer mode: Read-only access, no mutations allowed
  // - Blocks render normally but cannot be selected, dragged, or resized
  // - No autosave, undo, AI, uploads, or property panels
  // - This is enforced at the component level to prevent any editor state mutations
  
  return (
    <EditorErrorBoundary newsletterId={newsletterId}>
      <LiveEditingProvider
        value={{
          broadcastMutation: liveEditing.broadcastMutation,
          isConnected: liveEditing.isConnected,
        }}
      >
      <div className="flex h-screen flex-col overflow-hidden bg-white dark:bg-zinc-950">
        {/* Top toolbar - simplified in viewer mode */}
        <EditorTopBar
          newsletterTitle={newsletter?.title}
          onTitleChange={isViewerMode ? undefined : handleTitleChange}
          onAIClick={isViewerMode ? undefined : () => setIsAIPanelOpen(true)}
          isViewerMode={isViewerMode}
          isOwner={isOwner}
          presence={presence}
          role={presenceRole}
        />

        {/* Main content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar - hidden in viewer mode */}
          {!isViewerMode && <EditorSidebar />}

          {/* Center canvas wrapper - read-only in viewer mode */}
          <EditorCanvasWrapper 
            isViewerMode={isViewerMode}
            presence={presence}
          />

          {/* Right properties panel - hidden in viewer mode */}
          {!isViewerMode && <EditorPropertiesPanel />}
        </div>

        {/* Floating overlay layer - disabled in viewer mode */}
        {!isViewerMode && (
          <>
            <TextFloatingToolbar />
            <PositionSidebarWrapper />
            <TextEffectsPanelWrapper />
          </>
        )}

        {/* AI Panel - disabled in viewer mode */}
        {!isViewerMode && (
          <AIPanel
            isOpen={isAIPanelOpen}
            onClose={() => setIsAIPanelOpen(false)}
          />
        )}

      </div>
      </LiveEditingProvider>
    </EditorErrorBoundary>
  );
}
