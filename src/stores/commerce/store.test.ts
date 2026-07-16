import { beforeEach, describe, expect, it } from "vitest";
import { useCommerceStore } from "./store";

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

  it("장바구니에 없는 상품을 toggle하면 추가한다", () => {
    useCommerceStore.getState().toggleCart("p1");

    expect(useCommerceStore.getState().cartProductIds).toEqual(["p1"]);
  });

  it("장바구니에 있는 상품을 toggle하면 제거한다", () => {
    useCommerceStore.setState({ cartProductIds: ["p1"] });

    useCommerceStore.getState().toggleCart("p1");

    expect(useCommerceStore.getState().cartProductIds).toEqual([]);
  });

  it("장바구니와 위시리스트 상태는 서로 독립적으로 변경된다", () => {
    useCommerceStore.getState().toggleWishlist("p1");
    useCommerceStore.getState().toggleCart("p2");

    expect(useCommerceStore.getState().wishlistProductIds).toEqual(["p1"]);
    expect(useCommerceStore.getState().cartProductIds).toEqual(["p2"]);
  });
});
