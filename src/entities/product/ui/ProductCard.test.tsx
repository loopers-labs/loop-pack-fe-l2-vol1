import { cleanup, render, screen } from "@testing-library/react";
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

  it("floating action과 bottom action을 정해진 위치에 렌더링한다", () => {
    render(
      <ProductCard
        product={product}
        floatingAction={<button type="button">floating action</button>}
        bottomAction={<button type="button">bottom action</button>}
      />,
    );

    const floatingAction = screen.getByRole("button", { name: "floating action" });
    const bottomAction = screen.getByRole("button", { name: "bottom action" });

    expect(floatingAction.parentElement).toHaveAttribute("data-slot", "floating-action");
    expect(bottomAction.parentElement).toHaveAttribute("data-slot", "bottom-action");
  });

  it("action slot이 없어도 상품 정보를 렌더링한다", () => {
    render(<ProductCard product={product} />);

    expect(screen.getByRole("img", { name: "테스트 상품" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "테스트 상품" })).toBeInTheDocument();
    expect(screen.getByText("Loopers Select")).toBeInTheDocument();
    expect(screen.getByText("10,000원")).toBeInTheDocument();
  });
});
