import { describe, expect, it } from "vitest";
import { getProductListRedirectPath } from "./normalizeProductListSearchParams";

describe("getProductListRedirectPath", () => {
  it("상품 목록 query가 모두 유효하면 redirect path를 반환하지 않는다", () => {
    expect(
      getProductListRedirectPath({
        q: "bag",
        category: "goods",
        sort: "popular",
        page: "2",
      }),
    ).toBeNull();
  });

  it("유효하지 않은 query는 제거하고 유효한 query는 유지한다", () => {
    expect(
      getProductListRedirectPath({
        q: "bag",
        category: "wrong",
        sort: "hello",
        page: "-1",
      }),
    ).toBe("/products?q=bag");
  });

  it("redirect URL을 만들 때 기본값 query는 제거한다", () => {
    expect(
      getProductListRedirectPath({
        category: "wrong",
        sort: "latest",
        page: "1",
      }),
    ).toBe("/products");
  });
});
