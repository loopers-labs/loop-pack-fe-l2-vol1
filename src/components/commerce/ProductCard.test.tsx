import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import type { ImgHTMLAttributes } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProductCard } from "./ProductCard";
import type { ProductCardItem } from "./ProductCard";

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => createElement("img", props),
}));

const product: ProductCardItem = {
  id: "p1",
  image: "/images/products/p1.jpg",
  imageAlt: "테스트 상품",
  brand: "Loopers Select",
  name: "테스트 상품",
  priceText: "10,000원",
};

describe("ProductCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("위시리스트 상태와 버튼 문구를 props 기준으로 렌더링한다", () => {
    render(
      <ProductCard
        product={product}
        wishlistLabel="테스트 상품 위시리스트"
        cartLabel="테스트 상품 장바구니"
        isInWishlist={true}
        isInCart={false}
        onWishlistToggle={() => {}}
        onCartToggle={() => {}}
      />,
    );

    const wishlistButton = screen.getByRole("button", { name: "테스트 상품 위시리스트" });

    expect(wishlistButton).toHaveAttribute("aria-pressed", "true");
    expect(wishlistButton).toHaveTextContent("찜 해제");
  });

  it("장바구니 상태와 버튼 문구를 props 기준으로 렌더링한다", () => {
    render(
      <ProductCard
        product={product}
        wishlistLabel="테스트 상품 위시리스트"
        cartLabel="테스트 상품 장바구니"
        isInWishlist={false}
        isInCart={true}
        onWishlistToggle={() => {}}
        onCartToggle={() => {}}
      />,
    );

    const cartButton = screen.getByRole("button", { name: "테스트 상품 장바구니" });

    expect(cartButton).toHaveAttribute("aria-pressed", "true");
    expect(cartButton).toHaveTextContent("빼기");
  });

  it("버튼을 누르면 전달받은 action을 호출한다", async () => {
    const onWishlistToggle = vi.fn();
    const onCartToggle = vi.fn();

    render(
      <ProductCard
        product={product}
        wishlistLabel="테스트 상품 위시리스트"
        cartLabel="테스트 상품 장바구니"
        isInWishlist={false}
        isInCart={false}
        onWishlistToggle={onWishlistToggle}
        onCartToggle={onCartToggle}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "테스트 상품 위시리스트" }));
    await userEvent.click(screen.getByRole("button", { name: "테스트 상품 장바구니" }));

    expect(onWishlistToggle).toHaveBeenCalledTimes(1);
    expect(onCartToggle).toHaveBeenCalledTimes(1);
  });
});
