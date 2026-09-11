// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useCartStore } from "@/entities/cart/model/cartStore";
import { useWishlistStore } from "@/entities/wishlist/model/wishlistStore";
import { ClearCartButton } from "@/features/clear-cart/ui/ClearCartButton";

beforeEach(() => {
  useCartStore.setState({ cartIds: [] });
  useWishlistStore.setState({ wishlistIds: [] });
});

describe("ClearCartButton", () => {
  it("장바구니를 비우되 위시리스트는 건드리지 않는다(독립 store 격리)", () => {
    act(() => {
      useCartStore.getState().addToCart("p1");
      useCartStore.getState().addToCart("p2");
      useWishlistStore.getState().toggleWishlist("p3");
    });

    render(<ClearCartButton />);
    const button = screen.getByRole("button", { name: "장바구니 비우기" });

    fireEvent.click(button);

    expect(useCartStore.getState().cartIds).toEqual([]);
    // 격리 검증: cart만 비우고 wishlist는 그대로.
    expect(useWishlistStore.getState().wishlistIds).toEqual(["p3"]);
    // 비운 뒤엔 누를 게 없어 비활성화된다.
    expect(button).toBeDisabled();
  });

  it("빈 장바구니에선 비활성화된다", () => {
    render(<ClearCartButton />);
    expect(screen.getByRole("button", { name: "장바구니 비우기" })).toBeDisabled();
  });
});
