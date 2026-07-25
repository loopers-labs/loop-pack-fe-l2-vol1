import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "../../mocks/render";
import { useCommerceStore } from "./store";
import { ProductCard } from "./product-card";
import type { Product } from "./api/types";

afterEach(cleanup);
beforeEach(() => {
  useCommerceStore.setState({ cartIds: new Set(), wishlistIds: new Set() }); // 카드가 store를 구독하므로 격리한다
});

const baseProduct: Product = {
  id: "p1",
  brand: "브랜드",
  name: "상품명",
  category: "casual",
  price: 75000,
  originalPrice: null,
  image: "/images/products/p1.jpg",
  freeShipping: true,
  sizes: [],
  rating: 4.5,
  reviewCount: 10,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("ProductCard", () => {
  it("할인 상품에서 정가는 취소선 요소 안에, 판매가는 취소선 밖에 있다", () => {
    const discounted: Product = { ...baseProduct, price: 75000, originalPrice: 89000 };

    render(<ProductCard product={discounted} />);

    expect(screen.getByText("89,000원").closest("s")).not.toBeNull();
    expect(screen.getByText("75,000원").closest("s")).toBeNull();
  });

  it("할인 상품에서 판매가와 정가가 서로 다른 라벨로 읽힌다", () => {
    const discounted: Product = { ...baseProduct, price: 75000, originalPrice: 89000 };

    render(<ProductCard product={discounted} />);

    expect(screen.getByText("판매가")).toBeVisible();
    expect(screen.getByText("정가")).toBeVisible();
  });

  it("할인이 없는 상품에서는 취소선 없이 판매가 라벨만 읽힌다", () => {
    render(<ProductCard product={baseProduct} />);

    expect(screen.getByText("판매가")).toBeInTheDocument();
    expect(screen.queryByText("정가")).not.toBeInTheDocument();
  });
});
