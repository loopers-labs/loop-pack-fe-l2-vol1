import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { createElement } from "react";
import type { ImgHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommerceHeader } from "@/widgets/header";
import { ProductListPageClient } from "./ProductListPage";
import { useCartStore } from "@/entities/cart";
import { useWishlistStore } from "@/entities/wishlist";
import type { Product } from "@/entities/product";
import { server } from "@/shared/config/vitest/mswServer";

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => createElement("img", props),
}));

function renderProductListWithHeader() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <NuqsTestingAdapter searchParams="" hasMemory>
        <CommerceHeader />
        <ProductListPageClient />
      </NuqsTestingAdapter>
    </QueryClientProvider>,
  );
}

describe("ProductListCommerceState", () => {
  beforeEach(() => {
    useCartStore.setState({
      cartProductIdMap: {},
      hasHydrated: true,
    });
    useWishlistStore.setState({
      wishlistProductIdMap: {},
      hasHydrated: true,
    });
    server.use(
      http.get("/api/products", () =>
        HttpResponse.json({
          products: [
            createProduct({
              id: "p1",
              name: "첫 번째 상품",
            }),
          ],
          categories: [],
          totalCount: 1,
          page: 1,
          pageSize: 12,
        }),
      ),
    );
  });

  afterEach(() => {
    cleanup();
  });

  it("상품 카드 action은 커머스 헤더 개수에도 반영된다", async () => {
    renderProductListWithHeader();

    expect(await screen.findByText("첫 번째 상품")).toBeInTheDocument();
    expect(screen.getByLabelText("위시리스트 0")).toBeInTheDocument();
    expect(screen.getByLabelText("장바구니 0")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "1번 상품 위시리스트" }));
    await userEvent.click(screen.getByRole("button", { name: "1번 상품 장바구니" }));

    expect(screen.getByLabelText("위시리스트 1")).toBeInTheDocument();
    expect(screen.getByLabelText("장바구니 1")).toBeInTheDocument();
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
