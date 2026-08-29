import { beforeEach, describe, expect, it } from "vitest";
import { useCartStore } from "./cartStore";
import type { CartStore } from "./cartStore";

describe("useCartStore", () => {
  beforeEach(() => {
    useCartStore.setState({
      cartProductQuantityMap: {},
      selectedCartProductIdMap: {},
      hasHydrated: false,
    });
  });

  it("장바구니에 없는 상품을 add하면 수량 1로 추가한다", () => {
    useCartStore.getState().addCartItem("p1");

    expect(useCartStore.getState().cartProductQuantityMap).toEqual({ p1: 1 });
    expect(useCartStore.getState().selectedCartProductIdMap).toEqual({ p1: true });
  });

  it("장바구니에 담긴 상품을 다시 add하면 수량을 1 늘린다", () => {
    useCartStore.setState({ cartProductQuantityMap: { p1: 1 } });

    useCartStore.getState().addCartItem("p1");

    expect(useCartStore.getState().cartProductQuantityMap).toEqual({ p1: 2 });
  });

  it("상품 수량을 1씩 늘리고 줄인다", () => {
    useCartStore.setState({ cartProductQuantityMap: { p1: 1 } });

    useCartStore.getState().increaseCartQuantity("p1");
    useCartStore.getState().decreaseCartQuantity("p1");

    expect(useCartStore.getState().cartProductQuantityMap).toEqual({ p1: 1 });
  });

  it("수량 1인 상품을 줄이면 장바구니에서 제거한다", () => {
    useCartStore.setState({
      cartProductQuantityMap: { p1: 1 },
      selectedCartProductIdMap: { p1: true },
    });

    useCartStore.getState().decreaseCartQuantity("p1");

    expect(useCartStore.getState().cartProductQuantityMap).toEqual({});
    expect(useCartStore.getState().selectedCartProductIdMap).toEqual({});
  });

  it("장바구니를 비우면 모든 상품 수량을 제거한다", () => {
    useCartStore.setState({
      cartProductQuantityMap: { p1: 1, p2: 2 },
      selectedCartProductIdMap: { p1: true },
    });

    useCartStore.getState().clearCart();

    expect(useCartStore.getState().cartProductQuantityMap).toEqual({});
    expect(useCartStore.getState().selectedCartProductIdMap).toEqual({});
  });

  it("장바구니 상품 선택을 toggle하면 선택 상태를 추가하고 제거한다", () => {
    useCartStore.setState({
      cartProductQuantityMap: { p1: 1, p2: 1 },
      selectedCartProductIdMap: { p1: true },
    });

    useCartStore.getState().toggleCartItemSelection("p1");
    useCartStore.getState().toggleCartItemSelection("p2");

    expect(useCartStore.getState().selectedCartProductIdMap).toEqual({ p2: true });
  });

  it("선택된 장바구니 상품만 제거한다", () => {
    useCartStore.setState({
      cartProductQuantityMap: { p1: 1, p2: 2 },
      selectedCartProductIdMap: { p1: true },
    });

    useCartStore.getState().removeSelectedCartItems();

    expect(useCartStore.getState().cartProductQuantityMap).toEqual({ p2: 2 });
    expect(useCartStore.getState().selectedCartProductIdMap).toEqual({});
  });

  it("장바구니 상태가 map이 아니어도 add하면 안전한 수량 map으로 복구한다", () => {
    useCartStore.setState(JSON.parse('{ "cartProductQuantityMap": "13" }'));

    useCartStore.getState().addCartItem("p14");

    expect(useCartStore.getState().cartProductQuantityMap).toEqual({ p14: 1 });
  });

  it("persist 저장값이 같은 version이어도 map이 아니면 빈 map으로 복구한다", () => {
    const mergePersistedState = useCartStore.persist.getOptions().merge;

    if (mergePersistedState === undefined) {
      throw new Error("persist merge가 설정되어 있어야 합니다.");
    }

    const currentState = {
      cartProductQuantityMap: {},
      selectedCartProductIdMap: {},
      addCartItem: () => undefined,
      increaseCartQuantity: () => undefined,
      decreaseCartQuantity: () => undefined,
      clearCart: () => undefined,
      toggleCartItemSelection: () => undefined,
      removeSelectedCartItems: () => undefined,
      hasHydrated: false,
      setHasHydrated: () => undefined,
    } satisfies CartStore;

    const mergedState = mergePersistedState(
      {
        cartProductQuantityMap: "13",
      },
      currentState,
    );

    expect(mergedState.cartProductQuantityMap).toEqual({});
    expect(mergedState.selectedCartProductIdMap).toEqual({});
  });
});
