import { describe, expect, it } from "vitest";
import * as commerce from "./index";
import type {
  ApiErrorResponse,
  Category,
  CategoryId,
  HomeResponse,
  MockApiScenario,
  Product,
  ProductListQuery,
  ProductListResponse,
  ProductSort,
} from "./index";

// 배럴이 실제로 내보내야 하는 런타임 이름 9개(도메인 함수 5개 + UI 4개).
const RUNTIME_EXPORT_NAMES = [
  "waitForMockApi",
  "getHomeData",
  "isCategoryId",
  "isProductSort",
  "queryProducts",
  "CommerceProviders",
  "Header",
  "HomeView",
  "ListView",
];

// 피처 내부 구현 — 배럴에 새어 나오면 안 된다.
const PRIVATE_IMPLEMENTATION_NAMES = [
  "useListQuery",
  "LIST_QUERY_PARSERS",
  "PAGE_SIZE",
  "CATEGORY_FILTER_VALUES",
  "pageParser",
  "ProductCard",
  "ProductSection",
  "ListFilterBar",
  "ListPagination",
  "homeQueryOptions",
  "productListQueryOptions",
  "fetchHome",
  "fetchProductList",
];

describe("commerce 배럴(index.ts)", () => {
  it("런타임 export가 정확히 9개이며 이름 집합이 일치한다", () => {
    const keys = Object.keys(commerce).sort();

    expect(keys).toEqual([...RUNTIME_EXPORT_NAMES].sort());
  });

  it.each(PRIVATE_IMPLEMENTATION_NAMES)("비공개 구현 %s를 내보내지 않는다", (name) => {
    expect(Object.keys(commerce)).not.toContain(name);
  });

  it("UI 4개(CommerceProviders·Header·HomeView·ListView)는 함수다", () => {
    expect(typeof commerce.CommerceProviders).toBe("function");
    expect(typeof commerce.Header).toBe("function");
    expect(typeof commerce.HomeView).toBe("function");
    expect(typeof commerce.ListView).toBe("function");
  });

  it("도메인 함수 5개(waitForMockApi·getHomeData·isCategoryId·isProductSort·queryProducts)도 함수다", () => {
    expect(typeof commerce.waitForMockApi).toBe("function");
    expect(typeof commerce.getHomeData).toBe("function");
    expect(typeof commerce.isCategoryId).toBe("function");
    expect(typeof commerce.isProductSort).toBe("function");
    expect(typeof commerce.queryProducts).toBe("function");
  });
});

// 타입은 컴파일 시점에 지워져 런타임에 셀 수 없다 — 9개 전부를 참조하는 타입 계약을
// 만들어 `pnpm typecheck`가 통과하는 것으로 배럴이 9개를 그대로 노출함을 보증한다.
// 이 타입 선언 자체가 검증이다 — 이 선언이 존재하고 tsc를 통과한다는 사실이 곧
// 검증 결과이므로, `pnpm typecheck`가 게이트고 별도의 런타임 단정(it/expect)은
// 필요 없다.
type _BarrelTypeContract = {
  apiErrorResponse: ApiErrorResponse;
  category: Category;
  categoryId: CategoryId;
  homeResponse: HomeResponse;
  mockApiScenario: MockApiScenario;
  product: Product;
  productListQuery: ProductListQuery;
  productListResponse: ProductListResponse;
  productSort: ProductSort;
};
