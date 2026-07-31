// @vitest-environment jsdom
// Advanced D — 상태 아키텍처 테스트

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { AddToCartButton } from "@/features/add-to-cart";
// 위젯 내부 컴포넌트라 public API 로 노출하지 않으나, 이 계약 테스트는 헤더 개수 파생을 직접 검증하려 내부를 집는다.
import { CommerceHeaderCounts } from "@/widgets/commerce/ui/CommerceHeaderCounts";
import { ProductList } from "@/_pages/products/ui/ProductList";
import { useCartStore } from "@/entities/cart";
import { makeQueryClient } from "@/shared/api";
import {
  normalizeProductListQuery,
  productQueries,
  resolveProductListQuery,
} from "@/entities/product";
import { getProducts } from "@/entities/product/api/fetchProducts";
import type { Product, ProductListResponse } from "@/entities/product";

vi.mock("@/entities/product/api/fetchProducts", () => ({
  getProducts: vi.fn(),
}));

const getProductsMock = vi.mocked(getProducts);

// 담기 버튼을 렌더하는 테스트용 조합(실제로는 ProductCard 가 조합).
function ProductActions({ productId }: { productId: string }) {
  return <AddToCartButton productId={productId} />;
}

function makeProduct(id: string): Product {
  return {
    id,
    brand: "브랜드",
    name: `상품-${id}`,
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

// 싱글톤 store 를 매 테스트 초기화한다. 토글이 persist 로 localStorage 에 쓰므로 그것도 비운다.
beforeEach(() => {
  getProductsMock.mockReset();
  localStorage.clear();
  useCartStore.setState({ ids: new Set(), hasHydrated: true });
});

afterEach(cleanup);

// 요구사항 1 — 계약: action 으로 담고/빼면, 그 상태를 selector 로 구독한 버튼이 즉시 바뀐다.
describe("Zustand action 과 selector", () => {
  test("담기 토글 action 이 selector 로 구독한 버튼 상태를 바꾼다", () => {
    render(<ProductActions productId="p1" />);

    fireEvent.click(
      screen.getByRole("button", { name: "장바구니", pressed: false }),
    );
    expect(
      screen.getByRole("button", { name: "장바구니", pressed: true }),
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: "장바구니", pressed: true }),
    );
    expect(
      screen.getByRole("button", { name: "장바구니", pressed: false }),
    ).toBeTruthy();
  });
});

// 요구사항 2 — 계약: 헤더 개수는 store 에서 파생되고, 복원 전엔 실제 개수 대신 placeholder 를 보인다.
describe("헤더 개수 파생", () => {
  test("복원 전엔 실제 개수를 감추고, 복원 후엔 store 개수를 파생해 보이며 담기에 즉시 반응한다", () => {
    // 개수 element 는 role 이 없어(단순 표시값) data-testid 로 잡고, 보이는 숫자만 assert 한다
    // → 헤더 label 텍스트·포맷·i18n 이 바뀌어도 안 깨진다.
    useCartStore.setState({ hasHydrated: false });
    render(
      <>
        <CommerceHeaderCounts />
        <ProductActions productId="p1" />
      </>,
    );

    // 복원 전: 실제 개수("0")가 아직 안 보인다(placeholder 로 가림)
    expect(screen.getByTestId("cart-count").textContent).not.toBe("0");

    // 복원 후: store 의 개수(size)를 그대로 파생해 드러낸다
    act(() => {
      useCartStore.setState({ hasHydrated: true });
    });
    expect(screen.getByTestId("cart-count").textContent).toBe("0");

    // 담기 action → 파생 개수가 즉시 갱신(헤더가 store 를 selector 로 구독)
    fireEvent.click(screen.getByRole("button", { name: "장바구니" }));
    expect(screen.getByTestId("cart-count").textContent).toBe("1");
  });
});

// 요구사항 3 — 계약: URL 조건이 곧 사용자가 보는 목록이다. URL 을 파싱한 조건과 목록 요청·queryKey 가 같은 하나를 가리킨다.
describe("nuqs URL 조건과 TanStack Query query key 의 일치", () => {
  test("URL 조건이 그대로 목록 요청·queryKey 조건과 일치한다", async () => {
    getProductsMock.mockResolvedValue(makeResponse(2, [makeProduct("p1")]));

    render(
      <QueryClientProvider client={makeQueryClient()}>
        <NuqsTestingAdapter searchParams="?category=home&sort=price-asc&page=2">
          <ProductList />
        </NuqsTestingAdapter>
      </QueryClientProvider>,
    );

    // 이 테스트의 URL 조건(위 searchParams 와 동일). resolve 로 page 하한만 방어한 상태.
    const urlCondition = resolveProductListQuery({
      q: "",
      category: "home",
      sort: "price-asc",
      page: 2,
    });

    // 하드코딩 대신 실제 정규화 함수로 도출해 스키마가 바뀌어도 어긋나지 않게 한다.
    // 요청 인자와 queryKey 가 둘 다 이 하나를 가리켜야 "URL=보이는 목록"이 성립한다.
    const expectedCondition = normalizeProductListQuery(urlCondition);

    // (1) URL 조건 그대로 getProducts 가 불린다.
    await waitFor(() =>
      expect(getProductsMock).toHaveBeenCalledWith(expectedCondition),
    );

    // (2) 그 조건이 productQueries.list(URL 조건).queryKey 와 같은 조건을 가리킨다.
    const { queryKey } = productQueries.list(urlCondition);
    expect(queryKey).toEqual([...productQueries.lists(), expectedCondition]);
  });
});

// 요구사항 4 — 계약: 홈·목록은 같은 store 를 본다. 한 화면에서 담으면 다른 화면·헤더가 같이 바뀐다.
describe("홈과 목록이 같은 store 상태를 표시하는지", () => {
  test("한 곳에서 담으면 다른 곳 같은 상품 버튼·헤더가 같이 바뀐다", () => {
    render(
      <>
        <div data-testid="home-surface">
          <ProductActions productId="p1" />
        </div>
        <div data-testid="list-surface">
          <ProductActions productId="p1" />
        </div>
        <CommerceHeaderCounts />
      </>,
    );

    // within(el): 쿼리를 그 element 의 하위 트리로 한정한다.
    // 두 surface 에 같은 상품의 동일한 "장바구니" 버튼이 있어 screen.getByRole 로는 여러 개가 잡혀 실패한다
    // → 각 surface 안으로 좁혀 한쪽 버튼만 집고, 다른 쪽이 따라 바뀌는지(같은 store 공유)를 본다.
    const homeSurface = within(screen.getByTestId("home-surface"));
    const listSurface = within(screen.getByTestId("list-surface"));

    fireEvent.click(homeSurface.getByRole("button", { name: "장바구니" }));

    // 홈에서 담았는데 목록 쪽 같은 상품 버튼도 pressed 로 바뀐다
    expect(
      listSurface.getByRole("button", { name: "장바구니", pressed: true }),
    ).toBeTruthy();
    expect(screen.getByTestId("cart-count").textContent).toBe("1");
  });
});
