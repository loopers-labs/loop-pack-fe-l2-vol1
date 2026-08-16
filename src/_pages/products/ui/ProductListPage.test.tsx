import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import type { OnUrlUpdateFunction } from "nuqs/adapters/testing";
import { createElement } from "react";
import type { ImgHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProductListPageClient } from "./ProductListPage";
import type { ProductListQuery, ProductListResponse } from "../api/productApi";
import { useCartStore } from "@/entities/cart";
import { useWishlistStore } from "@/entities/wishlist";
import { server } from "@/shared/config/vitest/mswServer";
import {
  createMockProduct,
  createMockProductListResponse,
} from "@/shared/testing/commerceFixtures";

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => createElement("img", props),
}));

const firstProduct = createMockProduct({
  id: "p1",
  name: "첫 번째 상품",
});
const prefetchedProduct = createMockProduct({
  id: "p2",
  name: "미리 가져온 상품",
});
let productRequestUrls: string[] = [];

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
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    useCartStore.setState({
      cartProductIdMap: {},
    });
    useWishlistStore.setState({
      wishlistProductIdMap: {},
    });
    productRequestUrls = [];
    mockProductsResponse(() =>
      createMockProductListResponse({
        totalCount: 30,
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    window.history.replaceState(null, "", "/");
  });

  describe("목록 상태", () => {
    it("데이터 없는 최초 진입에서는 pending UI를 먼저 보여주고 성공 응답 후 상품 목록으로 전환한다", async () => {
      const deferredProductsResponse = createDeferredProductListResponse();
      mockProductsResponse(() => deferredProductsResponse.response);

      renderProductListPageClient({
        searchParams: "",
      });

      expect(screen.getByLabelText("상품을 불러오는 중입니다.")).toBeInTheDocument();
      expect(screen.queryByText("조건에 맞는 상품이 없습니다.")).not.toBeInTheDocument();
      expect(screen.queryByText("상품 목록을 불러오지 못했습니다.")).not.toBeInTheDocument();
      expect(screen.queryByText("첫 번째 상품")).not.toBeInTheDocument();

      deferredProductsResponse.resolve(
        createMockProductListResponse({
          products: [firstProduct],
          totalCount: 1,
        }),
      );

      expect(await screen.findByText("첫 번째 상품")).toBeInTheDocument();
      expect(screen.queryByLabelText("상품을 불러오는 중입니다.")).not.toBeInTheDocument();
    });

    it("현재 URL 조건의 결과가 0건이면 빈 결과 안내를 보여준다", async () => {
      mockProductsResponse(() =>
        createMockProductListResponse({
          products: [],
          totalCount: 0,
        }),
      );

      renderProductListPageClient({
        searchParams: "?q=없는상품",
      });

      expect(await screen.findByText("조건에 맞는 상품이 없습니다.")).toBeInTheDocument();
      expectGetProductsCalledWithParams({
        q: "없는상품",
      });
      expect(
        screen.getByText((_content, element) => element?.textContent === "총 0개"),
      ).toBeInTheDocument();
      expect(screen.queryByText("첫 번째 상품")).not.toBeInTheDocument();
      expect(screen.queryByText("상품 목록을 불러오지 못했습니다.")).not.toBeInTheDocument();
    });
  });

  describe("URL 조건", () => {
    it("응답 이후 현재 page가 마지막 페이지를 넘으면 마지막 페이지로 replace한다", async () => {
      mockProductsResponse(() =>
        createMockProductListResponse({
          totalCount: 30,
          page: 100,
        }),
      );

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
        expectGetProductsCalledWithParams({
          page: 1,
        });
      });

      expect(window.location.search).toBe("?page=-1");
    });

    it("유효하지 않은 category query가 들어오면 기본 category로 조회하고 URL은 유지한다", async () => {
      renderProductListPageClient({
        searchParams: "?category=wrong",
      });

      await waitFor(() => {
        expectGetProductsCalledWithParams({
          category: "all",
        });
      });

      expect(window.location.search).toBe("?category=wrong");
    });

    it("유효하지 않은 sort query가 들어오면 기본 sort로 조회하고 URL은 유지한다", async () => {
      renderProductListPageClient({
        searchParams: "?sort=wrong",
      });

      await waitFor(() => {
        expectGetProductsCalledWithParams({
          sort: "latest",
        });
      });

      expect(window.location.search).toBe("?sort=wrong");
    });

    it("유효한 query가 들어오면 URL을 다시 쓰지 않는다", async () => {
      const { onUrlUpdate } = renderProductListPageClient({
        searchParams: "?category=goods&sort=popular&page=2",
      });

      await waitFor(() => {
        expect(productRequestUrls.length).toBeGreaterThan(0);
      });

      expect(onUrlUpdate).not.toHaveBeenCalled();
    });
  });

  describe("필터 조건 변경", () => {
    it("카테고리를 변경하면 URL 상태와 조회 조건을 page 1 기준으로 갱신한다", async () => {
      const { onUrlUpdate } = renderProductListPageClient({
        searchParams: "?category=all&sort=latest&page=3",
      });

      await userEvent.click(screen.getByRole("button", { name: "카테고리" }));
      await userEvent.click(screen.getByRole("option", { name: "뷰티·잡화" }));

      expectUrlUpdatedWithParams(onUrlUpdate, {
        category: "goods",
        page: 1,
      });
      await waitFor(() => {
        expectGetProductsCalledWithParams({
          category: "goods",
          page: 1,
        });
      });
    });

    it("정렬을 변경하면 URL 상태와 조회 조건을 page 1 기준으로 갱신한다", async () => {
      const { onUrlUpdate } = renderProductListPageClient({
        searchParams: "?category=goods&sort=latest&page=3",
      });

      await userEvent.click(screen.getByRole("button", { name: "정렬" }));
      await userEvent.click(screen.getByRole("option", { name: "인기순" }));

      expectUrlUpdatedWithParams(onUrlUpdate, {
        sort: "popular",
        page: 1,
      });
      await waitFor(() => {
        expectGetProductsCalledWithParams({
          sort: "popular",
          page: 1,
        });
      });
    });
  });

  describe("페이지네이션", () => {
    it("페이지 전환 중에는 이전 상품 목록을 유지하고 갱신 중 상태를 표시한다", async () => {
      mockProductsResponse((url) => {
        if (url.searchParams.get("page") === "3") {
          return new Promise<ProductListResponse>(() => {});
        }

        return createMockProductListResponse({
          products: [firstProduct],
          totalCount: 36,
          page: 2,
        });
      });

      renderProductListPageClient({
        searchParams: "?page=2",
      });

      expect(await screen.findByText("첫 번째 상품")).toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: "다음" }));

      await waitFor(() => {
        expectGetProductsCalledWithParams({
          page: 3,
        });
      });

      expect(screen.getByText("첫 번째 상품")).toBeInTheDocument();
      expect(screen.queryByText("두 번째 상품")).not.toBeInTheDocument();
      expect(screen.getByLabelText("상품 목록")).toHaveAttribute("aria-busy", "true");
    });

    it("페이지를 변경하면 URL 상태를 갱신하고 상품 목록 필터 영역으로 스크롤한다", async () => {
      mockProductsResponse(() =>
        createMockProductListResponse({
          products: [firstProduct],
          totalCount: 24,
        }),
      );

      const { onUrlUpdate } = renderProductListPageClient({
        searchParams: "?page=1",
      });

      expect(await screen.findByText("첫 번째 상품")).toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: "다음" }));

      expectUrlUpdatedWithParams(onUrlUpdate, {
        page: 2,
      });
      expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({
        block: "start",
      });
    });

    it("다음 페이지가 있으면 현재 조건의 다음 페이지를 미리 가져온다", async () => {
      mockProductsResponse(() =>
        createMockProductListResponse({
          products: [firstProduct],
          totalCount: 24,
        }),
      );

      renderProductListPageClient({
        searchParams: "?category=goods&sort=popular&page=1",
      });

      await waitFor(() => {
        expectGetProductsCalledWithParams({
          category: "goods",
          sort: "popular",
          page: 2,
        });
      });
    });

    it("마지막 페이지이면 다음 페이지를 미리 가져오지 않는다", async () => {
      mockProductsResponse(() =>
        createMockProductListResponse({
          products: [firstProduct],
          totalCount: 24,
          page: 2,
        }),
      );

      renderProductListPageClient({
        searchParams: "?page=2",
      });

      await waitFor(() => {
        expectGetProductsCalledWithParams({
          page: 2,
        });
      });

      expectGetProductsNotCalledWithParams({
        page: 3,
      });
    });
  });

  describe("에러 상태", () => {
    it("최초 상품 목록 요청이 실패하면 실패 화면을 보여주고 다시 시도 성공 후 목록으로 복구한다", async () => {
      let requestCount = 0;
      mockProductsResponse(() => {
        requestCount += 1;

        if (requestCount === 1) {
          return HttpResponse.json(
            { message: "상품 목록을 불러오지 못했습니다." },
            {
              status: 500,
            },
          );
        }

        return createMockProductListResponse({
          products: [firstProduct],
          totalCount: 1,
        });
      });

      renderProductListPageClient({
        searchParams: "",
      });

      expect(await screen.findByText("상품 목록을 불러오지 못했습니다.")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();
      expect(screen.queryByText("조건에 맞는 상품이 없습니다.")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("상품 목록")).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: "다시 시도" }));

      expect(await screen.findByText("첫 번째 상품")).toBeInTheDocument();
      expect(screen.queryByText("상품 목록을 불러오지 못했습니다.")).not.toBeInTheDocument();
    });

    it("기존 목록 갱신에 실패하면 기존 상품 목록을 유지하고 다시 시도할 수 있다", async () => {
      mockProductsResponse((url) => {
        if (url.searchParams.get("category") === "goods") {
          return HttpResponse.json(
            { message: "상품 목록을 불러오지 못했습니다." },
            {
              status: 500,
            },
          );
        }

        if (url.searchParams.get("page") === "2") {
          return createMockProductListResponse({
            products: [prefetchedProduct],
            totalCount: 30,
            page: 2,
          });
        }

        return createMockProductListResponse({
          products: [firstProduct],
          totalCount: 30,
        });
      });

      renderProductListPageClient({
        searchParams: "",
      });

      expect(await screen.findByText("첫 번째 상품")).toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: "카테고리" }));
      await userEvent.click(screen.getByRole("option", { name: "뷰티·잡화" }));

      expect(
        await screen.findByText("상품 목록을 갱신하지 못했습니다. 기존 목록을 계속 보여드립니다."),
      ).toBeInTheDocument();
      expect(screen.getByText("첫 번째 상품")).toBeInTheDocument();
      expect(screen.queryByText("미리 가져온 상품")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();
      expect(screen.getByLabelText("상품 목록")).toHaveAttribute("aria-busy", "false");
    });
  });

  describe("검색과 필터 초기화", () => {
    it("검색어는 debounce 완료 후 URL 상태와 조회 조건에 반영한다", async () => {
      const { onUrlUpdate } = renderProductListPageClient({
        searchParams: "",
      });

      await waitFor(() => {
        expectGetProductsCalledWithParams({
          q: "",
        });
      });

      vi.useFakeTimers();

      fireEvent.change(screen.getByRole("textbox", { name: "검색" }), {
        target: { value: "스탠리" },
      });

      expectGetProductsNotCalledWithParams({
        q: "스탠리",
      });
      expect(onUrlUpdate).not.toHaveBeenCalledWith(
        expect.objectContaining({
          queryString: "?q=%EC%8A%A4%ED%83%A0%EB%A6%AC",
        }),
      );

      act(() => {
        vi.advanceTimersByTime(300);
      });
      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });
      vi.useRealTimers();

      await waitFor(() => {
        expectGetProductsCalledWithParams({
          q: "스탠리",
        });
      });

      await waitFor(() => {
        expectUrlUpdatedWithParams(onUrlUpdate, {
          q: "스탠리",
          page: 1,
        });
      });
    });

    it("필터를 초기화하면 검색 input의 draft 값도 비운다", async () => {
      renderProductListPageClient({
        searchParams: "?q=스탠리&category=goods&sort=popular&page=2",
      });

      const searchInput = screen.getByRole("textbox", { name: "검색" });

      expect(searchInput).toHaveValue("스탠리");

      await userEvent.click(screen.getByRole("button", { name: "필터 초기화" }));

      expect(searchInput).toHaveValue("");
    });
  });
});

function createDeferredProductListResponse() {
  let resolve: (response: ProductListResponse) => void = () => undefined;
  const response = new Promise<ProductListResponse>((resolveResponse) => {
    resolve = resolveResponse;
  });

  return {
    response,
    resolve,
  };
}

function mockProductsResponse(
  resolver: (url: URL) => ProductListResponse | Response | Promise<ProductListResponse | Response>,
) {
  server.use(
    http.get("/api/products", async ({ request }) => {
      productRequestUrls.push(request.url);

      const response = await resolver(new URL(request.url));

      if (response instanceof Response) {
        return response;
      }

      return HttpResponse.json(response);
    }),
  );
}

function expectGetProductsCalledWithParams(params: Partial<ProductListQuery>) {
  expect(productRequestUrls.some((requestUrl) => requestUrlMatchesParams(requestUrl, params))).toBe(
    true,
  );
}

function expectGetProductsNotCalledWithParams(params: Partial<ProductListQuery>) {
  expect(productRequestUrls.some((requestUrl) => requestUrlMatchesParams(requestUrl, params))).toBe(
    false,
  );
}

function expectUrlUpdatedWithParams(
  onUrlUpdate: ReturnType<typeof vi.fn<OnUrlUpdateFunction>>,
  params: Partial<ProductListQuery>,
) {
  const calls = onUrlUpdate.mock.calls.map(([urlUpdate]) => urlUpdate.queryString);

  expect(
    calls.some((queryString) => queryStringMatchesParams(queryString, params)),
    `expected URL update calls ${JSON.stringify(calls)} to include ${JSON.stringify(params)}`,
  ).toBe(true);
}

function requestUrlMatchesParams(requestUrl: string, params: Partial<ProductListQuery>) {
  const searchParams = new URL(requestUrl).searchParams;

  return searchParamsMatchValues(searchParams, params, {
    allowDefaultOmission: false,
  });
}

function queryStringMatchesParams(queryString: string, params: Partial<ProductListQuery>) {
  const searchParams = new URLSearchParams(queryString);

  return searchParamsMatchValues(searchParams, params, {
    allowDefaultOmission: true,
  });
}

function searchParamsMatchValues(
  searchParams: URLSearchParams,
  params: Partial<ProductListQuery>,
  { allowDefaultOmission }: { allowDefaultOmission: boolean },
) {
  return Object.entries(params).every(([key, value]) => {
    const requestValue = searchParams.get(key);

    if (allowDefaultOmission && requestValue === null && isDefaultProductListParam(key, value)) {
      return true;
    }

    if (value === "") {
      return requestValue === null || requestValue === "";
    }

    return requestValue === String(value);
  });
}

function isDefaultProductListParam(key: string, value: unknown) {
  return (
    (key === "q" && value === "") ||
    (key === "category" && value === "all") ||
    (key === "sort" && value === "latest") ||
    (key === "page" && value === 1)
  );
}
