import { beforeEach, describe, expect, it } from "vitest";
import { useCartStore } from "./store";

const initialState = useCartStore.getInitialState();

beforeEach(() => {
  useCartStore.setState(initialState, true);
});

describe("useCartStore", () => {
  it("빈 Set으로 시작하고 toggleCart는 새 Set으로 항목을 추가·제거한다", () => {
    const before = useCartStore.getState().cartIds;
    expect(before.size).toBe(0);

    useCartStore.getState().toggleCart("p1");
    expect(useCartStore.getState().cartIds.has("p1")).toBe(true);
    expect(useCartStore.getState().cartIds).not.toBe(before);

    useCartStore.getState().toggleCart("p1");
    expect(useCartStore.getState().cartIds.has("p1")).toBe(false);
  });
});
