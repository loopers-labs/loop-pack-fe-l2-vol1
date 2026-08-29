import { beforeEach, describe, expect, it } from "vitest";
import { useCartStore } from "./cartStore";
import type { CartStore } from "./cartStore";

describe("useCartStore", () => {
  beforeEach(() => {
    useCartStore.setState({
      cartProductQuantityMap: {},
      hasHydrated: false,
    });
  });

  it("장바구니에 없는 상품을 add하면 수량 1로 추가한다", () => {
    useCartStore.getState().addCartItem("p1");

    expect(useCartStore.getState().cartProductQuantityMap).toEqual({ p1: 1 });
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
    useCartStore.setState({ cartProductQuantityMap: { p1: 1 } });

    useCartStore.getState().decreaseCartQuantity("p1");

    expect(useCartStore.getState().cartProductQuantityMap).toEqual({});
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
      addCartItem: () => undefined,
      increaseCartQuantity: () => undefined,
      decreaseCartQuantity: () => undefined,
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
  });
});
