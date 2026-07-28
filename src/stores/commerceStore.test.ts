// Advanced A에 대한 테스트
import { afterAll, beforeEach, describe, expect, test, vi } from "vitest";

// 노드 테스트 환경엔 localStorage 가 없다. persist 의 기본 storage(localStorage)가 접근되기 전에
// 인메모리 목을 전역에 심고, 그 뒤에 store 를 import 해야 한다(그래서 아래는 동적 import).
function createLocalStorageMock(): Storage {
  let store: Record<string, string> = {};

  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
}

vi.stubGlobal("localStorage", createLocalStorageMock());

const { useCommerceStore } = await import("@/stores/commerceStore");

const STORAGE_KEY = "commerce-store";
const CURRENT_VERSION = 1;

function seedLocalStorage(state: unknown, version: number) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, version }));
}

beforeEach(() => {
  // 파일 내 싱글톤 store 와 목 storage 를 매 테스트 초기화한다.
  useCommerceStore.setState({
    cartIds: new Set(),
    wishlistIds: new Set(),
    hasHydrated: false,
  });
  localStorage.clear();
});

afterAll(() => {
  vi.unstubAllGlobals();
});

// 완료조건 1 — persist 로 새로고침 후 복원
describe("영속화·복원", () => {
  test("localStorage 에 저장된 장바구니·위시리스트를 rehydrate 로 복원한다", async () => {
    seedLocalStorage(
      { cartIds: ["p1", "p2"], wishlistIds: ["w1"] },
      CURRENT_VERSION,
    );

    await useCommerceStore.persist.rehydrate();

    const state = useCommerceStore.getState();
    expect([...state.cartIds]).toEqual(["p1", "p2"]);
    expect([...state.wishlistIds]).toEqual(["w1"]);
  });

  test("토글하면 후 localStorage에 쌓인다", () => {
    useCommerceStore.getState().toggleCart("p1-new");
    useCommerceStore.getState().toggleWishlist("w1-new");

    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw === null)
      throw new Error("토글 후 localStorage 에 저장되지 않았다");

    const parsed = JSON.parse(raw);
    expect(parsed.state.cartIds).toContain("p1-new");
    expect(parsed.state.wishlistIds).toContain("w1-new");
  });
});

// 완료조건 2 — hydration 불일치 없이 (skipHydration 불변식)
describe("hydration 안전성", () => {
  test("skipHydration: rehydrate 전에는 저장값이 있어도 빈 상태다 (서버·클라 첫 렌더 일치)", () => {
    seedLocalStorage({ cartIds: ["p1"], wishlistIds: [] }, CURRENT_VERSION);

    // rehydrate 를 호출하지 않았다 → 자동 복원이 없어야 첫 렌더가 서버(빈 상태)와 일치한다.
    const state = useCommerceStore.getState();
    expect(state.cartIds.size).toBe(0);
    expect(state.hasHydrated).toBe(false);
  });

  test("rehydrate 완료 후 hasHydrated 가 켜진다", async () => {
    seedLocalStorage({ cartIds: ["p1"], wishlistIds: [] }, CURRENT_VERSION);
    expect(useCommerceStore.getState().hasHydrated).toBe(false);

    await useCommerceStore.persist.rehydrate();

    expect(useCommerceStore.getState().hasHydrated).toBe(true);
  });
});

// 완료조건 3 — 잘못되거나 오래된 저장값의 복구 전략
describe("손상값 복구", () => {
  test("배열이 아니거나 문자열이 아닌 요소는 거른다", async () => {
    seedLocalStorage(
      { cartIds: "not-an-array", wishlistIds: [123, "w1", null] },
      CURRENT_VERSION,
    );

    await useCommerceStore.persist.rehydrate();

    const state = useCommerceStore.getState();
    expect([...state.cartIds]).toEqual([]); // 배열 아님 → 빈 목록
    expect([...state.wishlistIds]).toEqual(["w1"]); // 문자열만 남김
    expect(state.hasHydrated).toBe(true);
  });

  test("파싱 불가한 저장값은 빈 상태로 복구하고 크래시하지 않는다", async () => {
    localStorage.setItem(STORAGE_KEY, "{{{ not json");

    await expect(useCommerceStore.persist.rehydrate()).resolves.not.toThrow();

    const state = useCommerceStore.getState();
    expect(state.cartIds.size).toBe(0);
    expect(state.wishlistIds.size).toBe(0);
    // 복원 실패여도 onRehydrateStorage(복원 전 state 클로저)가 플래그를 켜 placeholder 에 갇히지 않는다.
    expect(state.hasHydrated).toBe(true);
  });
});

// 완료조건 4 — version 과 migrate
describe("version·migrate", () => {
  test("version 이 다르면 migrate가 저장값·버전과 함께 호출되고 결과가 복원된다", async () => {
    const originalMigrate = useCommerceStore.persist.getOptions().migrate;
    const migrateSpy = vi.fn(originalMigrate);
    // persist 미들웨어가 store에 붙여주는 API 중 하나로, 이미 만들어진 store의 persist 설정을 런타임에 덮어쓰는(부분 병합) 함수
    useCommerceStore.persist.setOptions({ migrate: migrateSpy });

    // version 0 은 현재(1)와 달라 migrate 경로를 탄다.
    seedLocalStorage({ cartIds: ["p1", 5, "p2"], wishlistIds: [] }, 0);
    await useCommerceStore.persist.rehydrate();

    expect(migrateSpy).toHaveBeenCalledOnce();
    expect(migrateSpy).toHaveBeenCalledWith(
      { cartIds: ["p1", 5, "p2"], wishlistIds: [] },
      0,
    );
    // migrate 를 거쳐 정제·복원됐는지도 확인(비문자열 5 제거)
    expect([...useCommerceStore.getState().cartIds]).toEqual(["p1", "p2"]);

    useCommerceStore.persist.setOptions({ migrate: originalMigrate });
  });
});
