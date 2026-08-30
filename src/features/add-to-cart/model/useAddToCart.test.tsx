import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAddToCart } from "./useAddToCart";
import { trackCartAdd } from "@/analytics/commerceEvents";
import { useCartStore } from "@/entities/cart";

vi.mock("@/analytics/commerceEvents", () => ({
  trackCartAdd: vi.fn(),
}));

describe("useAddToCart", () => {
  beforeEach(() => {
    useCartStore.setState({
      cartProductQuantityMap: {},
      selectedCartProductIdMap: {},
      hasHydrated: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("상품을 담으면 담긴 뒤의 상품별 수량을 보낸다", () => {
    const { result } = renderHook(() => useAddToCart("p1"));

    result.current.onClick();
    result.current.onClick();

    expect(trackCartAdd).toHaveBeenNthCalledWith(1, { productId: "p1", quantity: 1 });
    expect(trackCartAdd).toHaveBeenNthCalledWith(2, { productId: "p1", quantity: 2 });
  });
});
