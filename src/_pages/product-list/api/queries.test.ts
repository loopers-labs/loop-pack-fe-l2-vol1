import { describe, expect, it } from "vitest";
import { productListQueryOptions } from "./queries";
import type { ProductListQuery } from "./types";

const baseQuery: ProductListQuery = {
  q: "",
  category: "all",
  sort: "latest",
  page: 1,
  pageSize: 12,
};

describe("productListQueryOptions", () => {
  it("queryKey·queryFn·staleTime·gcTime을 한 정의에 담는다", () => {
    const options = productListQueryOptions(baseQuery);

    expect(typeof options.queryFn).toBe("function");
    expect(options.staleTime).toBe(60000);
    expect(options.gcTime).toBe(300000);
  });

  it("q·category·sort·page·pageSize 5개 필드를 모두 queryKey에 반영한다", () => {
    const baseKey = productListQueryOptions(baseQuery).queryKey;

    expect(productListQueryOptions({ ...baseQuery, q: "shoes" }).queryKey).not.toEqual(baseKey);
    expect(productListQueryOptions({ ...baseQuery, category: "casual" }).queryKey).not.toEqual(
      baseKey,
    );
    expect(productListQueryOptions({ ...baseQuery, sort: "popular" }).queryKey).not.toEqual(
      baseKey,
    );
    expect(productListQueryOptions({ ...baseQuery, page: 2 }).queryKey).not.toEqual(baseKey);
    expect(productListQueryOptions({ ...baseQuery, pageSize: 24 }).queryKey).not.toEqual(baseKey);
  });
});
