import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useToggleWishlist } from "./useToggleWishlist";
import { trackWishlistAdd } from "@/analytics/commerceEvents";
import { useWishlistStore } from "@/entities/wishlist";

vi.mock("@/analytics/commerceEvents", () => ({
  trackWishlistAdd: vi.fn(),
}));

describe("useToggleWishlist", () => {
  beforeEach(() => {
    useWishlistStore.setState({
      wishlistProductIdMap: {},
      hasHydrated: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("위시리스트 추가 이벤트는 추가할 때만 보내고 해제할 때는 보내지 않는다", () => {
    const { result, rerender } = renderHook(() => useToggleWishlist("p1"));

    result.current.onClick();
    rerender();
    result.current.onClick();

    expect(trackWishlistAdd).toHaveBeenCalledOnce();
    expect(trackWishlistAdd).toHaveBeenCalledWith({ productId: "p1" });
  });
});
