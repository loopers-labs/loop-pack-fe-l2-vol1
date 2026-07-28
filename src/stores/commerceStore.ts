import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type CommerceState = {
  cartIds: Set<string>;
  wishlistIds: Set<string>;
  // 복원(rehydrate)이 끝났는지. 복원 전엔 항상 빈 상태라, 소비부가 이 값으로 실제값/placeholder 를 가른다.
  // 참고 한 문서: https://zustand.docs.pmnd.rs/reference/integrations/persisting-store-data#how-can-i-check-if-my-store-has-been-hydrated
  // 문서의 다른 방식(useEffect 안에서 setHydrated(persist.hasHydrated()) 를 동기 호출하는 훅)은 React set-state-in-effect 린트에 걸리기 때문에 사용하지 않음
  hasHydrated: boolean;
  toggleCart: (productId: string) => void;
  toggleWishlist: (productId: string) => void;
  setHasHydrated: (value: boolean) => void;
};

const STORAGE_KEY = "commerce-store";
const STORAGE_VERSION = 1;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// 저장값에서 유효한 문자열 ID 만 남긴다.
// → 손상됐거나 구버전이라 형태가 안 맞는 저장값을 빈 목록으로 안전 복구한다는 시나리오
function toIdArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is string => typeof item === "string");
}

function toggleInSet<T>(source: Set<T>, value: T): Set<T> {
  const next = new Set(source);

  if (next.has(value)) next.delete(value);
  else next.add(value);

  return next;
}

export const useCommerceStore = create<CommerceState>()(
  persist(
    (set) => ({
      cartIds: new Set(),
      wishlistIds: new Set(),
      hasHydrated: false,
      toggleCart: (productId) =>
        set((state) => ({ cartIds: toggleInSet(state.cartIds, productId) })),
      toggleWishlist: (productId) =>
        set((state) => ({
          wishlistIds: toggleInSet(state.wishlistIds, productId),
        })),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      storage: createJSONStorage(() => localStorage), // 기본 값이라 생략가능하나, 명시적으로 적어둬서 localStorage 를 쓰는지 확인하기 쉽도록 한다.
      name: STORAGE_KEY,
      // 저장 스키마 버전. 이 값과 저장된 값의 version 이 다르면 migrate 가 실행된다.
      version: STORAGE_VERSION,
      // Set 은 JSON 으로 직렬화되지 않으므로(=> {}) 저장 시 배열로 바꾼다(복원은 merge 에서 Set 으로).
      partialize: (state) => ({
        cartIds: [...state.cartIds],
        wishlistIds: [...state.wishlistIds],
      }),
      // 서버엔 localStorage 가 없다. 초기 렌더링 시 서버와 클라이언트 일치시키게 하기 위함.
      // providers에서 수동으로 rehydrate() 를 호출해 복원한다.
      skipHydration: true,
      // 버전이 다른(구버전) 저장값을 현재 버전으로 옮기는 지점.
      migrate: (persisted) => {
        const state: Record<string, unknown> = isRecord(persisted)
          ? persisted
          : {};

        return {
          cartIds: toIdArray(state.cartIds),
          wishlistIds: toIdArray(state.wishlistIds),
        };
      },
      // persisted(여기선 localStorage)를 현재 상태(current)에 merge한다
      // createJSONStorage 미들웨어 덕에 persisted는 JSON.parse 된 값이 들어옴
      merge: (persisted, current) => {
        const state: Record<string, unknown> = isRecord(persisted)
          ? persisted
          : {};

        return {
          ...current,
          cartIds: new Set(toIdArray(state.cartIds)),
          wishlistIds: new Set(toIdArray(state.wishlistIds)),
        };
      },
      onRehydrateStorage: (state) => () => {
        state.setHasHydrated(true);
      },
    },
  ),
);
