import { beforeEach, describe, expect, it } from "vitest";
import { useWishlistStore } from "./wishlistStore";
import type { WishlistStore } from "./wishlistStore";

describe("useWishlistStore", () => {
  beforeEach(() => {
    useWishlistStore.setState({
      wishlistProductIdMap: {},
      hasHydrated: false,
    });
  });

  it("위시리스트에 없는 상품을 toggle하면 추가한다", () => {
    useWishlistStore.getState().toggleWishlist("p1");

    expect(useWishlistStore.getState().wishlistProductIdMap).toEqual({ p1: true });
  });

  it("위시리스트에 있는 상품을 toggle하면 제거한다", () => {
    useWishlistStore.setState({ wishlistProductIdMap: { p1: true } });

    useWishlistStore.getState().toggleWishlist("p1");

    expect(useWishlistStore.getState().wishlistProductIdMap).toEqual({});
  });

  it("위시리스트 상태가 map이 아니어도 toggle하면 안전한 map으로 복구한다", () => {
    useWishlistStore.setState(JSON.parse('{ "wishlistProductIdMap": "24" }'));

    useWishlistStore.getState().toggleWishlist("p25");

    expect(useWishlistStore.getState().wishlistProductIdMap).toEqual({ p25: true });
  });

  it("persist 저장값이 같은 version이어도 map이 아니면 빈 map으로 복구한다", () => {
    const mergePersistedState = useWishlistStore.persist.getOptions().merge;

    if (mergePersistedState === undefined) {
      throw new Error("persist merge가 설정되어 있어야 합니다.");
    }

    const currentState = {
      wishlistProductIdMap: {},
      toggleWishlist: () => undefined,
      hasHydrated: false,
      setHasHydrated: () => undefined,
    } satisfies WishlistStore;

    const mergedState = mergePersistedState(
      {
        wishlistProductIdMap: "24",
      },
      currentState,
    );

    expect(mergedState.wishlistProductIdMap).toEqual({});
  });
});
