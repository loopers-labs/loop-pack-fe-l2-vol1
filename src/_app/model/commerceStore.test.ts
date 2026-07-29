import { beforeEach, describe, expect, it } from "vitest";
import { useCommerceStore } from "./commerceStore";
import type { CommerceStore } from "./commerceStore";

describe("useCommerceStore", () => {
  beforeEach(() => {
    useCommerceStore.setState({
      cartProductIdMap: {},
      wishlistProductIdMap: {},
    });
  });

  it("위시리스트에 없는 상품을 toggle하면 추가한다", () => {
    useCommerceStore.getState().toggleWishlist("p1");

    expect(useCommerceStore.getState().wishlistProductIdMap).toEqual({ p1: true });
  });

  it("위시리스트에 있는 상품을 toggle하면 제거한다", () => {
    useCommerceStore.setState({ wishlistProductIdMap: { p1: true } });

    useCommerceStore.getState().toggleWishlist("p1");

    expect(useCommerceStore.getState().wishlistProductIdMap).toEqual({});
  });

  it("위시리스트 상태가 map이 아니어도 toggle하면 안전한 map으로 복구한다", () => {
    useCommerceStore.setState(JSON.parse('{ "wishlistProductIdMap": "24" }'));

    useCommerceStore.getState().toggleWishlist("p25");

    expect(useCommerceStore.getState().wishlistProductIdMap).toEqual({ p25: true });
  });

  it("장바구니에 없는 상품을 toggle하면 추가한다", () => {
    useCommerceStore.getState().toggleCart("p1");

    expect(useCommerceStore.getState().cartProductIdMap).toEqual({ p1: true });
  });

  it("장바구니에 있는 상품을 toggle하면 제거한다", () => {
    useCommerceStore.setState({ cartProductIdMap: { p1: true } });

    useCommerceStore.getState().toggleCart("p1");

    expect(useCommerceStore.getState().cartProductIdMap).toEqual({});
  });

  it("장바구니 상태가 map이 아니어도 toggle하면 안전한 map으로 복구한다", () => {
    useCommerceStore.setState(JSON.parse('{ "cartProductIdMap": "13" }'));

    useCommerceStore.getState().toggleCart("p14");

    expect(useCommerceStore.getState().cartProductIdMap).toEqual({ p14: true });
  });

  it("장바구니와 위시리스트 상태는 서로 독립적으로 변경된다", () => {
    useCommerceStore.getState().toggleWishlist("p1");
    useCommerceStore.getState().toggleCart("p2");

    expect(useCommerceStore.getState().wishlistProductIdMap).toEqual({ p1: true });
    expect(useCommerceStore.getState().cartProductIdMap).toEqual({ p2: true });
  });

  it("persist 저장값이 같은 version이어도 map이 아니면 빈 map으로 복구한다", () => {
    const mergePersistedState = useCommerceStore.persist.getOptions().merge;

    if (mergePersistedState === undefined) {
      throw new Error("persist merge가 설정되어 있어야 합니다.");
    }

    const currentState = {
      cartProductIdMap: {},
      wishlistProductIdMap: {},
      toggleCart: () => undefined,
      toggleWishlist: () => undefined,
      hasHydrated: false,
      setHasHydrated: () => undefined,
    } satisfies CommerceStore;

    const mergedState = mergePersistedState(
      {
        cartProductIdMap: "13",
        wishlistProductIdMap: "24",
      },
      currentState,
    );

    expect(mergedState.cartProductIdMap).toEqual({});
    expect(mergedState.wishlistProductIdMap).toEqual({});
  });
});
