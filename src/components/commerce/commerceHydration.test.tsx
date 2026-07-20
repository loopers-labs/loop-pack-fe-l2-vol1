import { cleanup, render, screen } from "@testing-library/react";
import { createElement } from "react";
import type { ImgHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommerceHeader } from "./CommerceHeader";
import { CommerceProductCard } from "./CommerceProductCard";
import type { ProductCardItem } from "./ProductCard";
import { COMMERCE_STORE_STORAGE_KEY } from "@/stores/commerce/persistence";
import { useCommerceStore } from "@/stores/commerce/store";

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

describe("commerce hydration", () => {
  beforeEach(() => {
    localStorage.clear();
    useCommerceStore.setState({
      cartProductIds: [],
      wishlistProductIds: [],
      hasHydrated: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("store 복원 전에는 헤더 개수를 서버 기준 기본값으로 렌더링한다", () => {
    useCommerceStore.setState({
      cartProductIds: ["p1"],
      wishlistProductIds: ["p2"],
      hasHydrated: false,
    });

    render(<CommerceHeader />);

    expect(screen.getByText("위시리스트 0")).toBeInTheDocument();
    expect(screen.getByText("장바구니 0")).toBeInTheDocument();
  });

  it("store 복원 후에는 헤더 개수를 저장값 기준으로 렌더링한다", () => {
    useCommerceStore.setState({
      cartProductIds: ["p1"],
      wishlistProductIds: ["p2"],
      hasHydrated: true,
    });

    render(<CommerceHeader />);

    expect(screen.getByText("위시리스트 1")).toBeInTheDocument();
    expect(screen.getByText("장바구니 1")).toBeInTheDocument();
  });

  it("store 복원 전에는 상품 버튼 상태를 서버 기준 기본값으로 렌더링한다", () => {
    useCommerceStore.setState({
      cartProductIds: ["p1"],
      wishlistProductIds: ["p1"],
      hasHydrated: false,
    });

    render(
      <CommerceProductCard
        product={product}
        wishlistLabel="테스트 상품 위시리스트"
        cartLabel="테스트 상품 장바구니"
      />,
    );

    expect(screen.getByRole("button", { name: "테스트 상품 위시리스트" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "테스트 상품 장바구니" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("store 복원 후에는 상품 버튼 상태를 저장값 기준으로 렌더링한다", () => {
    useCommerceStore.setState({
      cartProductIds: ["p1"],
      wishlistProductIds: ["p1"],
      hasHydrated: true,
    });

    render(
      <CommerceProductCard
        product={product}
        wishlistLabel="테스트 상품 위시리스트"
        cartLabel="테스트 상품 장바구니"
      />,
    );

    expect(screen.getByRole("button", { name: "테스트 상품 위시리스트" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "테스트 상품 장바구니" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("저장값 파싱에 실패해도 복원 완료 상태로 전환한다", async () => {
    localStorage.setItem(COMMERCE_STORE_STORAGE_KEY, "not-json");

    await useCommerceStore.persist.rehydrate();

    expect(useCommerceStore.getState().hasHydrated).toBe(true);
  });
});
