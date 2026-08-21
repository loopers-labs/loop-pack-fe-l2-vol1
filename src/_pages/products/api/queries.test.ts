import { expect, it } from "vitest";
import type { ProductListParams } from "./get-products";
import { productListQueries } from "./queries";

const params = (overrides: Partial<ProductListParams> = {}): ProductListParams => ({
  q: "",
  scenario: null,
  category: "all",
  sort: "latest",
  page: 1,
  pageSize: 12,
  ...overrides,
});

it("같은 조건이면 두 번 만들어도 같은 queryKey가 나온다", () => {
  expect(productListQueries.list(params()).queryKey).toEqual(
    productListQueries.list(params()).queryKey,
  );
});

it("검색어의 앞뒤 공백은 정규화되어 같은 queryKey를 만든다", () => {
  expect(productListQueries.list(params({ q: " 셔츠 " })).queryKey).toEqual(
    productListQueries.list(params({ q: "셔츠" })).queryKey,
  );
});

it("공백뿐인 검색어는 빈 검색어와 같은 queryKey를 만든다", () => {
  expect(productListQueries.list(params({ q: " " })).queryKey).toEqual(
    productListQueries.list(params()).queryKey,
  );
});

it("목록 쿼리는 1분 staleTime 캐시 정책을 유지한다", () => {
  expect(productListQueries.list(params()).staleTime).toBe(60_000);
});

it("page만 달라도 서로 다른 queryKey가 나온다", () => {
  expect(productListQueries.list(params({ page: 2 })).queryKey).not.toEqual(
    productListQueries.list(params()).queryKey,
  );
});
