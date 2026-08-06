import { beforeEach, describe, expect, it } from "vitest";
import { useCartStore } from "./cartStore";
import type { CartStore } from "./cartStore";

describe("useCartStore", () => {
  beforeEach(() => {
    useCartStore.setState({
      cartProductIdMap: {},
      hasHydrated: false,
    });
  });

  it("장바구니에 없는 상품을 toggle하면 추가한다", () => {
    useCartStore.getState().toggleCart("p1");

    expect(useCartStore.getState().cartProductIdMap).toEqual({ p1: true });
  });

  it("장바구니에 있는 상품을 toggle하면 제거한다", () => {
    useCartStore.setState({ cartProductIdMap: { p1: true } });

    useCartStore.getState().toggleCart("p1");

    expect(useCartStore.getState().cartProductIdMap).toEqual({});
  });

  it("장바구니 상태가 map이 아니어도 toggle하면 안전한 map으로 복구한다", () => {
    useCartStore.setState(JSON.parse('{ "cartProductIdMap": "13" }'));

    useCartStore.getState().toggleCart("p14");

    expect(useCartStore.getState().cartProductIdMap).toEqual({ p14: true });
  });

  it("persist 저장값이 같은 version이어도 map이 아니면 빈 map으로 복구한다", () => {
    const mergePersistedState = useCartStore.persist.getOptions().merge;

    if (mergePersistedState === undefined) {
      throw new Error("persist merge가 설정되어 있어야 합니다.");
    }

    const currentState = {
      cartProductIdMap: {},
      toggleCart: () => undefined,
      hasHydrated: false,
      setHasHydrated: () => undefined,
    } satisfies CartStore;

    const mergedState = mergePersistedState(
      {
        cartProductIdMap: "13",
      },
      currentState,
    );

    expect(mergedState.cartProductIdMap).toEqual({});
  });
});
