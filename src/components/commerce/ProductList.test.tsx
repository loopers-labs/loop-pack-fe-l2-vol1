// @vitest-environment jsdom
// Advanced C — 페이지 전환 중 기존 목록 유지(keepPreviousData) + 오류 재시도(에러 경계 위임)

import { Component, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { ProductList } from "./ProductList";
import { makeQueryClient } from "@/lib/queryClient";
import { getProducts } from "@/services/commerce";
import type { Product, ProductListResponse } from "@/types/commerce";

vi.mock("@/services/commerce", () => ({ getProducts: vi.fn() }));

const getProductsMock = vi.mocked(getProducts);

const BOUNDARY_FALLBACK = "목록 에러 경계";

// 실제 앱에선 Next 의 error.tsx 가 세그먼트 경계이나 단위 테스트에선 최소 ErrorBoundary 로
// "render 중 throw 되어 경계로 넘어가는지"만 검증한다.
// Error Boundary 는 반드시 클래스여야 하고, getDerivedStateFromError(렌더용 fallback 상태) 또는
// componentDidCatch(로깅 등 side effect) 중 하나 이상을 구현해야 React 가 경계로 인식한다.
class TestErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  // 자식이 render 중 throw 하면 React 가 이 static 메서드를 호출하고(에러를 인자로 넘김),
  // 반환값을 경계 state 에 merge 한다 → hasError:true 로 바꿔 아래 render 가 fallback 을 그리게 한다.
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    return this.state.hasError ? (
      <p>{BOUNDARY_FALLBACK}</p>
    ) : (
      this.props.children
    );
  }
}

function makeProduct(id: string, name: string): Product {
  return {
    id,
    brand: "브랜드",
    name,
    category: "home",
    price: 1000,
    originalPrice: null,
    image: "/images/products/p1.jpg",
    freeShipping: false,
    sizes: [],
    rating: 0,
    reviewCount: 0,
    createdAt: "2024-01-01T00:00:00.000Z",
  };
}

function makeResponse(page: number, products: Product[]): ProductListResponse {
  return { products, categories: [], totalCount: 30, page, pageSize: 12 };
}

function renderList(searchParams = "?page=1") {
  // 프로덕션과 같은 throwOnError 정책을 쓰려고 makeQueryClient 를 쓰되,
  // 테스트에선 재시도 없이 실패를 즉시 노출하도록 retry 만 끈다.
  const queryClient = makeQueryClient();
  queryClient.setDefaultOptions({
    queries: { ...queryClient.getDefaultOptions().queries, retry: false },
  });

  // hasMemory: URL 쓰기(setPage 등)를 읽기 상태에 반영해 실제 네비게이션처럼 동작하게 한다.
  return render(
    <QueryClientProvider client={queryClient}>
      <NuqsTestingAdapter searchParams={searchParams} hasMemory>
        <TestErrorBoundary>
          <ProductList />
        </TestErrorBoundary>
      </NuqsTestingAdapter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  getProductsMock.mockReset();
});

afterEach(cleanup);

describe("ProductList", () => {
  test("보여줄 데이터가 없는 조회 실패 시 throw 해서 에러 경계로 넘어간다", async () => {
    getProductsMock.mockRejectedValue(new Error("서버 오류"));
    // 경계가 에러를 잡을 때 React 가 찍는 console.error 노이즈를 억제한다.
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    renderList();

    expect(await screen.findByText(BOUNDARY_FALLBACK)).toBeTruthy();

    consoleError.mockRestore();
  });

  test("페이지 전환 중 이전 목록을 유지한다(keepPreviousData)", async () => {
    // page 2 응답을 지연시켜 "전환 중" 상태를 만든다. page 별로 분기해
    // 자동 prefetch(항목 2)가 어떤 순서로 호출해도 같은 응답을 돌려주게 한다.
    let resolvePage2: (value: ProductListResponse) => void = () => {};
    const page2Promise = new Promise<ProductListResponse>((resolve) => {
      resolvePage2 = resolve;
    });
    getProductsMock.mockImplementation((query) =>
      query.page === 1
        ? Promise.resolve(makeResponse(1, [makeProduct("p1", "1페이지상품")]))
        : page2Promise,
    );

    renderList("?page=1");
    expect(await screen.findByText("1페이지상품")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "다음" }));

    // page 2 가 아직 도착 전이어도(전환 중) 이전 페이지 목록은 화면에 남아 있다
    await waitFor(() =>
      expect(
        getProductsMock.mock.calls.some((call) => call[0].page === 2),
      ).toBe(true),
    );
    expect(screen.getByText("1페이지상품")).toBeTruthy();

    resolvePage2(makeResponse(2, [makeProduct("p13", "2페이지상품")]));
    expect(await screen.findByText("2페이지상품")).toBeTruthy();
  });

  test("현재 페이지가 정착하면 다음 페이지를 미리 prefetch 한다", async () => {
    // page 번호를 상품명에 담아 어느 페이지 요청인지 구분한다.
    getProductsMock.mockImplementation((query) => {
      const page = query.page ?? 1;

      return Promise.resolve(
        makeResponse(page, [makeProduct(`p-${page}`, `${page}페이지상품`)]),
      );
    });

    renderList("?page=1");
    expect(await screen.findByText("1페이지상품")).toBeTruthy();

    // "다음"을 누르지 않아도, page 1 정착 직후 prefetch useEffect 가 page+1(=2)을 요청한다.
    // (page 1 에서 page 2 요청이 나올 경로는 이 prefetch 뿐이다.)
    await waitFor(() =>
      expect(
        getProductsMock.mock.calls.some((call) => call[0].page === 2),
      ).toBe(true),
    );
  });
});
