import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import type { OnUrlUpdateFunction } from "nuqs/adapters/testing";
import { createElement } from "react";
import type { ImgHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProductListContainer } from "./ProductListContainer";
import { getProducts } from "./api/productApi";
import type { ProductListResponse } from "./api/productApi";
import { useCommerceStore } from "@/stores/commerce/store";
import type { Product } from "@/types/commerce";

vi.mock("./api/productApi", () => ({
  getProducts: vi.fn(),
}));

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => createElement("img", props),
}));

const mockedGetProducts = vi.mocked(getProducts);

const firstProduct = createProduct({
  id: "p1",
  name: "첫 번째 상품",
});

function renderProductListContainer({
  searchParams,
  onUrlUpdate = vi.fn<OnUrlUpdateFunction>(),
}: {
  searchParams: string;
  onUrlUpdate?: ReturnType<typeof vi.fn<OnUrlUpdateFunction>>;
}) {
  window.history.replaceState(null, "", `/products${searchParams}`);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <NuqsTestingAdapter searchParams={searchParams} hasMemory onUrlUpdate={onUrlUpdate}>
        <ProductListContainer />
      </NuqsTestingAdapter>
    </QueryClientProvider>,
  );

  return { onUrlUpdate };
}

describe("ProductListContainer", () => {
  beforeEach(() => {
    useCommerceStore.setState({
      cartProductIds: [],
      wishlistProductIds: [],
    });
    mockedGetProducts.mockReset();
    mockedGetProducts.mockResolvedValue({
      products: [],
      categories: [],
      totalCount: 30,
      page: 1,
      pageSize: 12,
    });
  });

  afterEach(() => {
    cleanup();
    window.history.replaceState(null, "", "/");
  });

  it("응답 이후 현재 page가 마지막 페이지를 넘으면 마지막 페이지로 replace한다", async () => {
    mockedGetProducts.mockResolvedValue({
      products: [],
      categories: [],
      totalCount: 30,
      page: 100,
      pageSize: 12,
    });

    const { onUrlUpdate } = renderProductListContainer({
      searchParams: "?page=100",
    });

    await waitFor(() => {
      expect(onUrlUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          queryString: "?page=3",
          options: expect.objectContaining({
            history: "replace",
          }),
        }),
      );
    });
  });

  it("유효하지 않은 page query가 들어오면 기본 page로 조회하고 URL은 유지한다", async () => {
    renderProductListContainer({
      searchParams: "?page=-1",
    });

    await waitFor(() => {
      expect(mockedGetProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
        }),
      );
    });

    expect(window.location.search).toBe("?page=-1");
  });

  it("유효하지 않은 category query가 들어오면 기본 category로 조회하고 URL은 유지한다", async () => {
    renderProductListContainer({
      searchParams: "?category=wrong",
    });

    await waitFor(() => {
      expect(mockedGetProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          category: "all",
        }),
      );
    });

    expect(window.location.search).toBe("?category=wrong");
  });

  it("유효하지 않은 sort query가 들어오면 기본 sort로 조회하고 URL은 유지한다", async () => {
    renderProductListContainer({
      searchParams: "?sort=wrong",
    });

    await waitFor(() => {
      expect(mockedGetProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          sort: "latest",
        }),
      );
    });

    expect(window.location.search).toBe("?sort=wrong");
  });

  it("유효한 query가 들어오면 URL을 다시 쓰지 않는다", async () => {
    const { onUrlUpdate } = renderProductListContainer({
      searchParams: "?category=goods&sort=popular&page=2",
    });

    await waitFor(() => {
      expect(mockedGetProducts).toHaveBeenCalled();
    });

    expect(onUrlUpdate).not.toHaveBeenCalled();
  });

  it("페이지 전환 중에는 이전 상품 목록을 유지하고 갱신 중 상태를 표시한다", async () => {
    mockedGetProducts.mockImplementation((params = {}) => {
      if (params.page === 2) {
        return new Promise<ProductListResponse>(() => {});
      }

      return Promise.resolve({
        products: [firstProduct],
        categories: [],
        totalCount: 24,
        page: 1,
        pageSize: 12,
      });
    });

    renderProductListContainer({
      searchParams: "?page=1",
    });

    expect(await screen.findByText("첫 번째 상품")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "다음" }));

    await waitFor(() => {
      expect(mockedGetProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        }),
      );
    });

    expect(screen.getByText("첫 번째 상품")).toBeInTheDocument();
    expect(screen.queryByText("두 번째 상품")).not.toBeInTheDocument();
    expect(screen.getByLabelText("상품 목록")).toHaveAttribute("aria-busy", "true");
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
