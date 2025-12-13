import { create } from "zustand";
import type { Block, Position, Size, BlockStyles } from "@/types/blocks";

export type EditorMode = "idle" | "dragging" | "resizing";

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

  // Selectors (derived state)
  getBlock: (id: string) => Block | undefined;
  getSelectedBlock: () => Block | undefined;
  getBlocksByZIndex: () => Block[];

  // Reset
  reset: () => void;
}

const initialState = {
  blocks: [],
  selectedBlockId: null,
  hoveredBlockId: null,
  editorMode: "idle" as EditorMode,
  zoomLevel: 1,
};

export const useEditorStateStore = create<EditorStateStore>((set, get) => ({
  ...initialState,

  setBlocks: (blocks) => set({ blocks }),

  selectBlock: (id) => set({ selectedBlockId: id }),
  setHoveredBlock: (id) => set({ hoveredBlockId: id }),
  clearSelection: () => set({ selectedBlockId: null }),

  setEditorMode: (mode) => set({ editorMode: mode }),

  setZoomLevel: (level) => set({ zoomLevel: level }),

  addBlock: (block) =>
    set((state) => ({
      blocks: [...state.blocks, block],
    })),

  updateBlock: (id, updates) =>
    set((state) => ({
      blocks: state.blocks.map((block) =>
        block.id === id ? { ...block, ...updates } : block
      ),
    })),

  deleteBlock: (id) =>
    set((state) => ({
      blocks: state.blocks.filter((block) => block.id !== id),
      selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
    })),

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

  reset: () => set(initialState),
}));
