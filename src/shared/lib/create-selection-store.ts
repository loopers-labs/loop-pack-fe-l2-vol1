import { create } from "zustand";

export interface SelectionStore {
  ids: Set<string>;
  toggle: (id: string) => void;
}

export function createSelectionStore() {
  return create<SelectionStore>()((set) => ({
    ids: new Set<string>(),
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
