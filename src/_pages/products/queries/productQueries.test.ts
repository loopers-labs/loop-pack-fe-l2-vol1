import { describe, expect, it } from "vitest";
import { productQueries } from "./productQueries";
import type { ProductListQuery } from "../api/productApi";

describe("productQueries", () => {
  it("상품 목록 query key는 조회 조건 전체를 포함한다", () => {
    const params = {
      q: "스탠리",
      category: "goods",
      sort: "popular",
      page: 2,
      pageSize: 12,
    } satisfies ProductListQuery;

    expect(productQueries.list(params).queryKey).toEqual(["products", "list", params]);
  });
});
