import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// 담긴 상품 id 집합을 localStorage 에 영속화하는 store 를 만든다.
// 장바구니·위시리스트는 저장 방식이 같고 저장 키만 다르므로, 이 팩토리로 각각 독립 인스턴스를 만든다.
export type IdSetStore = {
  ids: Set<string>;
  // 복원(rehydrate)이 끝났는지. 복원 전엔 항상 빈 상태라, 소비부가 이 값으로 실제값/placeholder 를 가른다.
  hasHydrated: boolean;
  toggle: (id: string) => void;
  clear: () => void;
  setHasHydrated: (value: boolean) => void;
};

const STORAGE_VERSION = 1;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// 저장값에서 유효한 문자열 ID 만 남긴다 — 손상·구버전 저장값을 빈 목록으로 안전 복구한다.
function toIdArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is string => typeof item === "string");
}

function toggleInSet(source: Set<string>, value: string): Set<string> {
  const next = new Set(source);

  if (next.has(value)) next.delete(value);
  else next.add(value);

  return next;
}

export function createIdSetStore(storageKey: string) {
  return create<IdSetStore>()(
    persist(
      (set) => ({
        ids: new Set(),
        hasHydrated: false,
        toggle: (id) => set((state) => ({ ids: toggleInSet(state.ids, id) })),
        clear: () => set({ ids: new Set() }),
        setHasHydrated: (value) => set({ hasHydrated: value }),
      }),
      {
        storage: createJSONStorage(() => localStorage),
        name: storageKey,
        version: STORAGE_VERSION,
        // Set 은 JSON 직렬화가 안 되므로 저장 시 배열로 바꾼다(복원은 merge 에서 Set 으로).
        partialize: (state) => ({ ids: [...state.ids] }),
        // 서버엔 localStorage 가 없다 → 첫 렌더를 서버와 일치시키려 자동 복원을 끄고, providers 에서 수동 rehydrate.
        skipHydration: true,
        migrate: (persisted) => {
          const state = isRecord(persisted) ? persisted : {};

          return { ids: toIdArray(state.ids) };
        },
        merge: (persisted, current) => {
          const state = isRecord(persisted) ? persisted : {};

          return { ...current, ids: new Set(toIdArray(state.ids)) };
        },
        onRehydrateStorage: (state) => () => {
          state.setHasHydrated(true);
        },
      },
    ),
  );
}
