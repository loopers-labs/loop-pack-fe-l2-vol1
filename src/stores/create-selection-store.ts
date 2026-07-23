import { create } from "zustand";

export interface SelectionStore {
  ids: Set<string>;
  add: (id: string) => void;
  remove: (id: string) => void;
  toggle: (id: string) => void;
}

export function createSelectionStore() {
  return create<SelectionStore>()((set) => ({
    ids: new Set<string>(),
    add: (id) =>
      set((state) => {
        if (state.ids.has(id)) return state;
        const ids = new Set(state.ids);
        ids.add(id);
        return { ids };
      }),
    remove: (id) =>
      set((state) => {
        if (!state.ids.has(id)) return state;
        const ids = new Set(state.ids);
        ids.delete(id);
        return { ids };
      }),
    toggle: (id) =>
      set((state) => {
        const ids = new Set(state.ids);
        if (ids.has(id)) {
          ids.delete(id);
        } else {
          ids.add(id);
        }
        return { ids };
      }),
  }));
}
