import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import type { OnUrlUpdateFunction } from "nuqs/adapters/testing";
import { createElement } from "react";
import type { ImgHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProductListPageClient } from "./ProductListPageClient";
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

function renderProductListPageClient({
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
        <ProductListPageClient />
      </NuqsTestingAdapter>
    </QueryClientProvider>,
  );

  return { onUrlUpdate };
}

describe("ProductListPageClient", () => {
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
    vi.useRealTimers();
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

    const { onUrlUpdate } = renderProductListPageClient({
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
    renderProductListPageClient({
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
    renderProductListPageClient({
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
    renderProductListPageClient({
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
    const { onUrlUpdate } = renderProductListPageClient({
      searchParams: "?category=goods&sort=popular&page=2",
    });

    await waitFor(() => {
      expect(mockedGetProducts).toHaveBeenCalled();
    });

    expect(onUrlUpdate).not.toHaveBeenCalled();
  });

  it("페이지 전환 중에는 이전 상품 목록을 유지하고 갱신 중 상태를 표시한다", async () => {
    mockedGetProducts.mockImplementation((params = {}) => {
      if (params.page === 3) {
        return new Promise<ProductListResponse>(() => {});
      }

      return Promise.resolve({
        products: [firstProduct],
        categories: [],
        totalCount: 36,
        page: 2,
        pageSize: 12,
      });
    });

    renderProductListPageClient({
      searchParams: "?page=2",
    });

    expect(await screen.findByText("첫 번째 상품")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "다음" }));

    await waitFor(() => {
      expect(mockedGetProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 3,
        }),
      );
    });

    expect(screen.getByText("첫 번째 상품")).toBeInTheDocument();
    expect(screen.queryByText("두 번째 상품")).not.toBeInTheDocument();
    expect(screen.getByLabelText("상품 목록")).toHaveAttribute("aria-busy", "true");
  });

  it("다음 페이지가 있으면 현재 조건의 다음 페이지를 미리 가져온다", async () => {
    mockedGetProducts.mockResolvedValue({
      products: [firstProduct],
      categories: [],
      totalCount: 24,
      page: 1,
      pageSize: 12,
    });

    renderProductListPageClient({
      searchParams: "?category=goods&sort=popular&page=1",
    });

    await waitFor(() => {
      expect(mockedGetProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          category: "goods",
          sort: "popular",
          page: 2,
        }),
      );
    });
  });

  it("마지막 페이지이면 다음 페이지를 미리 가져오지 않는다", async () => {
    mockedGetProducts.mockResolvedValue({
      products: [firstProduct],
      categories: [],
      totalCount: 24,
      page: 2,
      pageSize: 12,
    });

    renderProductListPageClient({
      searchParams: "?page=2",
    });

    await waitFor(() => {
      expect(mockedGetProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        }),
      );
    });

    expect(mockedGetProducts).not.toHaveBeenCalledWith(
      expect.objectContaining({
        page: 3,
      }),
    );
  });

  it("검색어는 debounce 완료 후 URL 상태와 조회 조건에 반영한다", async () => {
    const { onUrlUpdate } = renderProductListPageClient({
      searchParams: "",
    });

    await waitFor(() => {
      expect(mockedGetProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          q: "",
        }),
      );
    });

    vi.useFakeTimers();

    fireEvent.change(screen.getByRole("textbox", { name: "검색" }), {
      target: { value: "스탠리" },
    });

    expect(mockedGetProducts).not.toHaveBeenCalledWith(
      expect.objectContaining({
        q: "스탠리",
      }),
    );
    expect(onUrlUpdate).not.toHaveBeenCalledWith(
      expect.objectContaining({
        queryString: "?q=%EC%8A%A4%ED%83%A0%EB%A6%AC",
      }),
    );

    act(() => {
      vi.advanceTimersByTime(300);
    });
    vi.useRealTimers();

    await waitFor(() => {
      expect(mockedGetProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          q: "스탠리",
        }),
      );
    });
  });

  it("필터를 초기화하면 검색 input의 draft 값도 비운다", async () => {
    renderProductListPageClient({
      searchParams: "?q=스탠리&category=goods&sort=popular&page=2",
    });

    const searchInput = screen.getByRole("textbox", { name: "검색" });

    expect(searchInput).toHaveValue("스탠리");

    await userEvent.click(screen.getByRole("button", { name: "필터 초기화" }));

    await waitFor(() => {
      expect(searchInput).toHaveValue("");
    });
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
