import { describe, expect, it } from "vitest";
import { loadProductListSearchParams } from "./searchParams";

describe("product list search params", () => {
  it("URL 조건이 없으면 상품 목록 조회 기본 조건으로 정규화한다", async () => {
    const params = await loadProductListSearchParams({});

    expect(params).toEqual({
      q: "",
      category: "all",
      sort: "latest",
      page: 1,
    });
  });

  it("유효한 URL 조건은 상품 목록 조회 조건으로 유지한다", async () => {
    const params = await loadProductListSearchParams({
      q: "스탠리",
      category: "goods",
      sort: "popular",
      page: "2",
    });

    expect(params).toEqual({
      q: "스탠리",
      category: "goods",
      sort: "popular",
      page: 2,
    });
  });

  it.each(["0", "-1", "abc"])("1보다 작거나 숫자가 아닌 page=%s는 1로 정규화한다", async (page) => {
    const params = await loadProductListSearchParams({ page });

    expect(params.page).toBe(1);
  });

  it("지원하지 않는 category와 sort는 기본 조건으로 정규화한다", async () => {
    const params = await loadProductListSearchParams({
      category: "wrong",
      sort: "wrong",
    });

    expect(params).toMatchObject({
      category: "all",
      sort: "latest",
    });
  });
});
