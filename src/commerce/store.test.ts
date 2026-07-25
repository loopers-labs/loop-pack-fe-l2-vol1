import { beforeEach, describe, expect, it } from "vitest";
import { useCommerceStore } from "./store";

const initialState = useCommerceStore.getInitialState();

beforeEach(() => {
  useCommerceStore.setState(initialState, true);
});

describe("useCommerceStore", () => {
  it("정확히 4개 멤버(cartIds·wishlistIds·toggleCart·toggleWishlist)만 노출한다", () => {
    expect(Object.keys(useCommerceStore.getState()).sort()).toEqual(
      ["cartIds", "toggleCart", "toggleWishlist", "wishlistIds"].sort(),
    );
  });

  it("초기 상태는 cartIds·wishlistIds 두 Set이 비어 있다", () => {
    const state = useCommerceStore.getState();

    expect(state.cartIds.size).toBe(0);
    expect(state.wishlistIds.size).toBe(0);
  });

  it("toggleCart를 두 번 호출하면 담겼다가 빠진다", () => {
    useCommerceStore.getState().toggleCart("p1");
    expect(useCommerceStore.getState().cartIds.has("p1")).toBe(true);

    useCommerceStore.getState().toggleCart("p1");
    expect(useCommerceStore.getState().cartIds.has("p1")).toBe(false);
  });

  it("toggleWishlist를 두 번 호출하면 담겼다가 빠진다", () => {
    useCommerceStore.getState().toggleWishlist("p1");
    expect(useCommerceStore.getState().wishlistIds.has("p1")).toBe(true);

    useCommerceStore.getState().toggleWishlist("p1");
    expect(useCommerceStore.getState().wishlistIds.has("p1")).toBe(false);
  });

  it("toggleCart는 cartIds를 새 Set 인스턴스로 교체한다", () => {
    const before = useCommerceStore.getState().cartIds;

    useCommerceStore.getState().toggleCart("p1");

    expect(useCommerceStore.getState().cartIds).not.toBe(before);
  });

  it("toggleWishlist는 wishlistIds를 새 Set 인스턴스로 교체한다", () => {
    const before = useCommerceStore.getState().wishlistIds;

    useCommerceStore.getState().toggleWishlist("p1");

    expect(useCommerceStore.getState().wishlistIds).not.toBe(before);
  });

  it("toggleCart는 wishlistIds를 건드리지 않는다", () => {
    const beforeWishlist = useCommerceStore.getState().wishlistIds;

    useCommerceStore.getState().toggleCart("p1");

    expect(useCommerceStore.getState().wishlistIds).toBe(beforeWishlist);
  });

  it("toggleWishlist는 cartIds를 건드리지 않는다", () => {
    const beforeCart = useCommerceStore.getState().cartIds;

    useCommerceStore.getState().toggleWishlist("p1");

    expect(useCommerceStore.getState().cartIds).toBe(beforeCart);
  });
});
