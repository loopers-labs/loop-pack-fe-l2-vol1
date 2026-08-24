import { afterAll, beforeEach, describe, expect, test, vi } from "vitest";
import { createLocalStorageMock } from "@/__tests__/helpers/localStorageMock";

// toggle이 persist 로 localStorage를 쓰기 때문에, store 모듈 import 전에 스텁을 심는다.
vi.stubGlobal("localStorage", createLocalStorageMock());

const { useCartStore } = await import("@/entities/cart/model/store");
const { useWishlistStore } = await import("@/entities/wishlist/model/store");

beforeEach(() => {
  localStorage.clear();
  useCartStore.setState({ ids: new Set() });
  useWishlistStore.setState({ ids: new Set() });
});

afterAll(() => {
  vi.unstubAllGlobals();
});

const cartCount = () => useCartStore.getState().ids.size;
const wishlistCount = () => useWishlistStore.getState().ids.size;

describe("week8 검증대상 1 — 개수 파생", () => {
  test("서로 다른 상품 두 개를 담으면 개수가 2다", () => {
    useCartStore.getState().toggle("p1");
    useCartStore.getState().toggle("p2");

    expect(cartCount()).toBe(2);
  });

  test("경계: 담은 상품을 다시 누르면(toggle) 개수가 원복된다", () => {
    useCartStore.getState().toggle("p1");
    expect(cartCount()).toBe(1);

    useCartStore.getState().toggle("p1");
    expect(cartCount()).toBe(0);
  });

  test("경계: 같은 상품이 중복으로 담긴 저장값을 복원해도 개수는 유니크 수로 접힌다", async () => {
    localStorage.setItem(
      "cart-store",
      JSON.stringify({ state: { ids: ["p1", "p1", "p2"] }, version: 1 }),
    );

    await useCartStore.persist.rehydrate();

    expect(cartCount()).toBe(2);
  });

  test("장바구니와 위시리스트는 개수가 서로 섞이지 않는다(독립 저장 키)", () => {
    useCartStore.getState().toggle("p1");

    expect(cartCount()).toBe(1);
    expect(wishlistCount()).toBe(0);
  });
});
