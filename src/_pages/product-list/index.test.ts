import { describe, expect, it } from "vitest";
import * as slice from "./index";
import type { ProductListQuery, ProductListResponse, ProductSort } from "./index";

describe("_pages/product-list 배럴(index.ts)", () => {
  it("runtime export가 ListView와 isProductSort다", () => {
    expect(Object.keys(slice).sort()).toEqual(["ListView", "isProductSort"]);
    expect(typeof slice.ListView).toBe("function");
    expect(typeof slice.isProductSort).toBe("function");
  });
});

type _ProductListTypeContract = {
  query: ProductListQuery;
  response: ProductListResponse;
  sort: ProductSort;
};
