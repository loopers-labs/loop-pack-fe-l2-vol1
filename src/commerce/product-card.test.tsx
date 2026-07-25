import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
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
  it("할인 상품에서 판매가와 정가를 스크린리더가 구별할 수 있는 텍스트로 낸다", () => {
    const discounted: Product = { ...baseProduct, price: 75000, originalPrice: 89000 };

    const { container } = render(<ProductCard product={discounted} />);

    const price = container.querySelector("strong");
    expect(price?.textContent).toBe("판매가75,000원정가89,000원");
  });

  it("할인이 없는 상품에서는 정가 레이블이 새어 나오지 않는다", () => {
    const { container } = render(<ProductCard product={baseProduct} />);

    const price = container.querySelector("strong");
    expect(price?.textContent).toBe("판매가75,000원");
  });
});
