// Advanced A — id 집합 영속 store 팩토리(cart·wishlist 가 공유하는 persist 로직) 테스트
import { afterAll, beforeEach, describe, expect, test, vi } from "vitest";
import { createLocalStorageMock } from "@/__tests__/helpers/localStorageMock";

vi.stubGlobal("localStorage", createLocalStorageMock());

const { createIdSetStore } = await import("./createIdSetStore");

const STORAGE_KEY = "test-store";
const CURRENT_VERSION = 1;

function seedLocalStorage(state: unknown, version: number) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, version }));
}

let useStore: ReturnType<typeof createIdSetStore>;

beforeEach(() => {
  localStorage.clear();
  // 매 테스트 새 store 인스턴스(skipHydration 라 빈 상태로 시작).
  useStore = createIdSetStore(STORAGE_KEY);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

// 완료조건 1 — persist 로 새로고침 후 복원
describe("영속화·복원", () => {
  test("localStorage 에 저장된 id 집합을 rehydrate 로 복원한다", async () => {
    seedLocalStorage({ ids: ["p1", "p2"] }, CURRENT_VERSION);

    await useStore.persist.rehydrate();

    expect([...useStore.getState().ids]).toEqual(["p1", "p2"]);
  });

  test("토글하면 localStorage 에 쌓인다", () => {
    useStore.getState().toggle("p1-new");

    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw === null)
      throw new Error("토글 후 localStorage 에 저장되지 않았다");

    const parsed = JSON.parse(raw);
    expect(parsed.state.ids).toContain("p1-new");
  });
});

// clear — 담긴 id 를 전부 비운다
describe("비우기", () => {
  test("clear 하면 담겨 있던 id 집합이 빈다", () => {
    useStore.getState().toggle("p1");
    useStore.getState().toggle("p2");
    expect(useStore.getState().ids.size).toBe(2);

    useStore.getState().clear();

    expect(useStore.getState().ids.size).toBe(0);
  });
});

// 완료조건 2 — hydration 불일치 없이 (skipHydration 불변식)
describe("hydration 안전성", () => {
  test("skipHydration: rehydrate 전에는 저장값이 있어도 빈 상태다 (서버·클라 첫 렌더 일치)", () => {
    seedLocalStorage({ ids: ["p1"] }, CURRENT_VERSION);

    // rehydrate 를 호출하지 않았다 → 자동 복원이 없어야 첫 렌더가 서버(빈 상태)와 일치한다.
    expect(useStore.getState().ids.size).toBe(0);
    expect(useStore.getState().hasHydrated).toBe(false);
  });

  test("rehydrate 완료 후 hasHydrated 가 켜진다", async () => {
    seedLocalStorage({ ids: ["p1"] }, CURRENT_VERSION);
    expect(useStore.getState().hasHydrated).toBe(false);

    await useStore.persist.rehydrate();

    expect(useStore.getState().hasHydrated).toBe(true);
  });
});

// 완료조건 3 — 잘못되거나 오래된 저장값의 복구 전략
describe("손상값 복구", () => {
  test("배열이 아니거나 문자열이 아닌 요소는 거른다", async () => {
    seedLocalStorage({ ids: [123, "w1", null] }, CURRENT_VERSION);

    await useStore.persist.rehydrate();

    expect([...useStore.getState().ids]).toEqual(["w1"]); // 문자열만 남김
    expect(useStore.getState().hasHydrated).toBe(true);
  });

  test("파싱 불가한 저장값은 빈 상태로 복구하고 크래시하지 않는다", async () => {
    localStorage.setItem(STORAGE_KEY, "{{{ not json");

    await expect(useStore.persist.rehydrate()).resolves.not.toThrow();

    expect(useStore.getState().ids.size).toBe(0);
    // 복원 실패여도 onRehydrateStorage(복원 전 state 클로저)가 플래그를 켜 placeholder 에 갇히지 않는다.
    expect(useStore.getState().hasHydrated).toBe(true);
  });
});

// 완료조건 4 — version 과 migrate
describe("version·migrate", () => {
  test("version 이 다르면 migrate 가 저장값·버전과 함께 호출되고 결과가 복원된다", async () => {
    const originalMigrate = useStore.persist.getOptions().migrate;
    const migrateSpy = vi.fn(originalMigrate);
    useStore.persist.setOptions({ migrate: migrateSpy });

    // version 0 은 현재(1)와 달라 migrate 경로를 탄다.
    seedLocalStorage({ ids: ["p1", 5, "p2"] }, 0);
    await useStore.persist.rehydrate();

    expect(migrateSpy).toHaveBeenCalledOnce();
    expect(migrateSpy).toHaveBeenCalledWith({ ids: ["p1", 5, "p2"] }, 0);
    // migrate 를 거쳐 정제·복원됐는지도 확인(비문자열 5 제거)
    expect([...useStore.getState().ids]).toEqual(["p1", "p2"]);
  });
});
