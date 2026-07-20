import { beforeEach, describe, expect, it } from "vitest";
import { useCommerceStore } from "./store";
import type { CommerceStore } from "./store";

describe("useCommerceStore", () => {
  beforeEach(() => {
    useCommerceStore.setState({
      cartProductIds: [],
      wishlistProductIds: [],
    });
  });

  it("위시리스트에 없는 상품을 toggle하면 추가한다", () => {
    useCommerceStore.getState().toggleWishlist("p1");

    expect(useCommerceStore.getState().wishlistProductIds).toEqual(["p1"]);
  });

  it("위시리스트에 있는 상품을 toggle하면 제거한다", () => {
    useCommerceStore.setState({ wishlistProductIds: ["p1"] });

    useCommerceStore.getState().toggleWishlist("p1");

    expect(useCommerceStore.getState().wishlistProductIds).toEqual([]);
  });

  it("위시리스트 상태가 배열이 아니어도 toggle하면 문자열을 쪼개지 않고 새 상품만 추가한다", () => {
    useCommerceStore.setState(JSON.parse('{ "wishlistProductIds": "24" }'));

    useCommerceStore.getState().toggleWishlist("p25");

    expect(useCommerceStore.getState().wishlistProductIds).toEqual(["p25"]);
  });

  it("장바구니에 없는 상품을 toggle하면 추가한다", () => {
    useCommerceStore.getState().toggleCart("p1");

    expect(useCommerceStore.getState().cartProductIds).toEqual(["p1"]);
  });

  it("장바구니에 있는 상품을 toggle하면 제거한다", () => {
    useCommerceStore.setState({ cartProductIds: ["p1"] });

    useCommerceStore.getState().toggleCart("p1");

    expect(useCommerceStore.getState().cartProductIds).toEqual([]);
  });

  it("장바구니 상태가 배열이 아니어도 toggle하면 문자열을 쪼개지 않고 새 상품만 추가한다", () => {
    useCommerceStore.setState(JSON.parse('{ "cartProductIds": "13" }'));

    useCommerceStore.getState().toggleCart("p14");

    expect(useCommerceStore.getState().cartProductIds).toEqual(["p14"]);
  });

  it("장바구니와 위시리스트 상태는 서로 독립적으로 변경된다", () => {
    useCommerceStore.getState().toggleWishlist("p1");
    useCommerceStore.getState().toggleCart("p2");

    expect(useCommerceStore.getState().wishlistProductIds).toEqual(["p1"]);
    expect(useCommerceStore.getState().cartProductIds).toEqual(["p2"]);
  });

  it("persist 저장값이 같은 version이어도 배열이 아니면 빈 배열로 복구한다", () => {
    const mergePersistedState = useCommerceStore.persist.getOptions().merge;

    if (mergePersistedState === undefined) {
      throw new Error("persist merge가 설정되어 있어야 합니다.");
    }

    const currentState = {
      cartProductIds: [],
      wishlistProductIds: [],
      toggleCart: () => undefined,
      toggleWishlist: () => undefined,
      hasHydrated: false,
      setHasHydrated: () => undefined,
    } satisfies CommerceStore;

    const mergedState = mergePersistedState(
      {
        cartProductIds: "13",
        wishlistProductIds: "24",
      },
      currentState,
    );

    expect(mergedState.cartProductIds).toEqual([]);
    expect(mergedState.wishlistProductIds).toEqual([]);
  });
});
