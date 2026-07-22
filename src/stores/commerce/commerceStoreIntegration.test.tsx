import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { createElement } from "react";
import type { ImgHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProductListPageClient } from "@/features/products/ProductListPageClient";
import { getProducts } from "@/features/products/api/productApi";
import { useCommerceStore } from "@/stores/commerce/store";
import type { Product } from "@/types/commerce";
import { ProductSection } from "@/components/commerce/ProductSection";

vi.mock("@/features/products/api/productApi", () => ({
  getProducts: vi.fn(),
}));

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => createElement("img", props),
}));

const mockedGetProducts = vi.mocked(getProducts);

function renderHomeSectionWithProductList() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const sharedProduct = createProduct({
    id: "p1",
    name: "같은 상품",
  });

  render(
    <QueryClientProvider client={queryClient}>
      <NuqsTestingAdapter searchParams="" hasMemory>
        <ProductSection title="인기 상품" products={[sharedProduct]} />
        <ProductListPageClient />
      </NuqsTestingAdapter>
    </QueryClientProvider>,
  );
}

describe("CommerceStoreIntegration", () => {
  beforeEach(() => {
    useCommerceStore.setState({
      cartProductIdMap: {},
      wishlistProductIdMap: {},
    });
    mockedGetProducts.mockReset();
    mockedGetProducts.mockResolvedValue({
      products: [
        createProduct({
          id: "p1",
          name: "같은 상품",
        }),
      ],
      categories: [],
      totalCount: 1,
      page: 1,
      pageSize: 12,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("홈과 목록에 같은 상품이 있으면 위시리스트 상태를 공유한다", async () => {
    renderHomeSectionWithProductList();

    await waitFor(() => {
      expect(screen.getAllByRole("heading", { name: "같은 상품" })).toHaveLength(2);
    });

    const homeWishlistButton = screen.getByRole("button", {
      name: "인기 상품 1번 상품 위시리스트",
    });
    const listWishlistButton = screen.getByRole("button", {
      name: "1번 상품 위시리스트",
    });

    expect(homeWishlistButton).toHaveAttribute("aria-pressed", "false");
    expect(listWishlistButton).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(homeWishlistButton);

    expect(homeWishlistButton).toHaveAttribute("aria-pressed", "true");
    expect(homeWishlistButton).toHaveTextContent("찜 해제");
    expect(listWishlistButton).toHaveAttribute("aria-pressed", "true");
    expect(listWishlistButton).toHaveTextContent("찜 해제");
  });
});

function createProduct(product: Partial<Product> = {}): Product {
  return {
    id: "product-id",
    brand: "Loopers Select",
    name: "상품명",
    category: "goods",
    price: 10000,
    originalPrice: null,
    image: "/images/products/p1.jpg",
    freeShipping: false,
    sizes: [],
    rating: 4.5,
    reviewCount: 10,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...product,
  };
}
