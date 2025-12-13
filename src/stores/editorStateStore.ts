import { create } from "zustand";
import type { Block, Position, Size, BlockStyles } from "@/types/blocks";

export type EditorMode = "idle" | "dragging" | "resizing";

interface HistoryState {
  past: Block[][];
  present: Block[];
  future: Block[][];
}

interface EditorStateStore {
  // Blocks
  blocks: Block[];
  setBlocks: (blocks: Block[]) => void;

  // Selection
  selectedBlockId: string | null;
  hoveredBlockId: string | null;
  selectBlock: (id: string | null) => void;
  setHoveredBlock: (id: string | null) => void;
  clearSelection: () => void;

  // Editor mode
  editorMode: EditorMode;
  setEditorMode: (mode: EditorMode) => void;

  // Zoom
  zoomLevel: number;
  setZoomLevel: (level: number) => void;

  // Block actions
  addBlock: (block: Block) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  deleteBlock: (id: string) => void;
  duplicateBlock: (id: string) => Block | null;
  moveBlock: (id: string, position: Position) => void;
  resizeBlock: (id: string, size: Size) => void;
  updateBlockStyles: (id: string, styles: Partial<BlockStyles>) => void;

  // Action grouping for AI operations
  startActionGroup: () => void;
  endActionGroup: () => void;
  isActionGrouping: boolean;

  // Undo/Redo
  history: HistoryState;
  canUndo: () => boolean;
  canRedo: () => boolean;
  undo: () => void;
  redo: () => void;
  pushHistory: (blocks: Block[]) => void;
  clearHistory: () => void;

  // Selectors (derived state)
  getBlock: (id: string) => Block | undefined;
  getSelectedBlock: () => Block | undefined;
  getBlocksByZIndex: () => Block[];

  // Reset
  reset: () => void;
}

const MAX_HISTORY_SIZE = 50;

const createHistoryState = (blocks: Block[]): HistoryState => ({
  past: [],
  present: blocks,
  future: [],
});

const initialState = {
  blocks: [],
  selectedBlockId: null,
  hoveredBlockId: null,
  editorMode: "idle" as EditorMode,
  zoomLevel: 1,
  history: createHistoryState([]),
  isActionGrouping: false,
};

// Deep clone blocks for history
function cloneBlocks(blocks: Block[]): Block[] {
  return JSON.parse(JSON.stringify(blocks));
}

export const useEditorStateStore = create<EditorStateStore>((set, get) => ({
  ...initialState,

  setBlocks: (blocks) => {
    const current = get();
    // Only push to history if blocks actually changed
    if (JSON.stringify(current.blocks) !== JSON.stringify(blocks)) {
      get().pushHistory(blocks);
    }
    set({ blocks });
  },

  selectBlock: (id) => set({ selectedBlockId: id }),
  setHoveredBlock: (id) => set({ hoveredBlockId: id }),
  clearSelection: () => set({ selectedBlockId: null }),

  setEditorMode: (mode) => set({ editorMode: mode }),

  setZoomLevel: (level) => set({ zoomLevel: level }),

  addBlock: (block) => {
    const newBlocks = [...get().blocks, block];
    get().pushHistory(newBlocks);
    set({ blocks: newBlocks });
  },

  updateBlock: (id, updates) => {
    const newBlocks = get().blocks.map((block) =>
      block.id === id ? { ...block, ...updates } : block
    );
    get().pushHistory(newBlocks);
    set({ blocks: newBlocks });
  },

  deleteBlock: (id) => {
    const newBlocks = get().blocks.filter((block) => block.id !== id);
    get().pushHistory(newBlocks);
    set({
      blocks: newBlocks,
      selectedBlockId: get().selectedBlockId === id ? null : get().selectedBlockId,
    });
  },

  duplicateBlock: (id) => {
    const block = get().getBlock(id);
    if (!block) return null;

    const duplicated: Block = {
      ...block,
      id: `${block.id}-copy-${Date.now()}`,
      position: {
        x: block.position.x + 20,
        y: block.position.y + 20,
      },
    };

    get().addBlock(duplicated);
    return duplicated;
  },

  moveBlock: (id, position) => {
    get().updateBlock(id, { position });
  },

  resizeBlock: (id, size) => {
    get().updateBlock(id, { size });
  },

  updateBlockStyles: (id, styles) => {
    const block = get().getBlock(id);
    if (!block) return;

    get().updateBlock(id, {
      styles: { ...block.styles, ...styles },
    });
  },

  // Action grouping for AI operations
  startActionGroup: () => set({ isActionGrouping: true }),
  endActionGroup: () => {
    const current = get();
    if (current.isActionGrouping) {
      // Push current state to history when ending group
      get().pushHistory(current.blocks);
      set({ isActionGrouping: false });
    }
  },

  // Undo/Redo implementation
  canUndo: () => {
    const history = get().history;
    return history.past.length > 0;
  },

  canRedo: () => {
    const history = get().history;
    return history.future.length > 0;
  },

  undo: () => {
    const history = get().history;
    if (history.past.length === 0) return;

    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);
    const newFuture = [history.present, ...history.future];

    const newHistory: HistoryState = {
      past: newPast,
      present: previous,
      future: newFuture.slice(0, MAX_HISTORY_SIZE),
    };

    set({
      blocks: cloneBlocks(previous),
      history: newHistory,
    });
  },

  redo: () => {
    const history = get().history;
    if (history.future.length === 0) return;

    const next = history.future[0];
    const newPast = [...history.past, history.present];
    const newFuture = history.future.slice(1);

    const newHistory: HistoryState = {
      past: newPast.slice(-MAX_HISTORY_SIZE),
      present: next,
      future: newFuture,
    };

    set({
      blocks: cloneBlocks(next),
      history: newHistory,
    });
  },

  pushHistory: (blocks: Block[]) => {
    const current = get();
    const history = current.history;
    
    // Don't push if we're in the middle of an action group
    if (current.isActionGrouping) {
      return;
    }

    // Don't push if blocks haven't changed
    if (JSON.stringify(history.present) === JSON.stringify(blocks)) {
      return;
    }

    const newHistory: HistoryState = {
      past: [...history.past, history.present].slice(-MAX_HISTORY_SIZE),
      present: cloneBlocks(blocks),
      future: [], // Clear future when new action is performed
    };

    set({ history: newHistory });
  },

  clearHistory: () => {
    const current = get();
    set({
      history: createHistoryState(current.blocks),
    });
  },

  // Selectors
  getBlock: (id) => {
    return get().blocks.find((block) => block.id === id);
  },

  getSelectedBlock: () => {
    const { selectedBlockId, getBlock } = get();
    return selectedBlockId ? getBlock(selectedBlockId) : undefined;
  },

  getBlocksByZIndex: () => {
    return [...get().blocks].sort((a, b) => a.zIndex - b.zIndex);
  },

  reset: () => {
    set({
      ...initialState,
      history: createHistoryState([]),
    });
  },
}));
