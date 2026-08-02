import { beforeEach, describe, expect, it } from "vitest";
import { useWishlistStore } from "./store";

const initialState = useWishlistStore.getInitialState();

beforeEach(() => {
  useWishlistStore.setState(initialState, true);
});

describe("useWishlistStore", () => {
  it("빈 Set으로 시작하고 toggleWishlist는 새 Set으로 항목을 추가·제거한다", () => {
    const before = useWishlistStore.getState().wishlistIds;
    expect(before.size).toBe(0);

    useWishlistStore.getState().toggleWishlist("p1");
    expect(useWishlistStore.getState().wishlistIds.has("p1")).toBe(true);
    expect(useWishlistStore.getState().wishlistIds).not.toBe(before);

    useWishlistStore.getState().toggleWishlist("p1");
    expect(useWishlistStore.getState().wishlistIds.has("p1")).toBe(false);
  });
});
