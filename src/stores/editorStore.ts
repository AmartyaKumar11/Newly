import { create } from "zustand";

export type EditorLifecycleState = "loading" | "ready" | "error";

interface EditorStore {
  // Lifecycle state
  lifecycleState: EditorLifecycleState;
  setLifecycleState: (state: EditorLifecycleState) => void;

  // Newsletter data
  newsletterId: string | null;
  setNewsletterId: (id: string | null) => void;

  // Dirty state tracking
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;

  // Saving state
  isSaving: boolean;
  setSaving: (saving: boolean) => void;

  // Last save timestamp
  lastSaved: Date | null;
  setLastSaved: (date: Date | null) => void;

  // Reset store
  reset: () => void;
}

const initialState = {
  lifecycleState: "loading" as EditorLifecycleState,
  newsletterId: null,
  isDirty: false,
  isSaving: false,
  lastSaved: null,
};

export const useEditorStore = create<EditorStore>((set) => ({
  ...initialState,

  setLifecycleState: (state) => set({ lifecycleState: state }),

  setNewsletterId: (id) => set({ newsletterId: id }),

  setDirty: (dirty) => set({ isDirty: dirty }),

  setSaving: (saving) => set({ isSaving: saving }),

  setLastSaved: (date) => set({ lastSaved: date }),

  reset: () => set(initialState),
}));
