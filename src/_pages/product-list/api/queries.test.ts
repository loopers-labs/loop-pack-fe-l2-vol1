import { describe, expect, it } from "vitest";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { HttpError } from "../../../shared/api";
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

  it("5xx와 네트워크 오류만 Error Boundary로 전파한다", () => {
    const options = productListQueryOptions(baseQuery);
    const { throwOnError } = options;
    const queryClient = new QueryClient();
    const observer = new QueryObserver(queryClient, options);
    const query = observer.getCurrentQuery();

    expect(typeof throwOnError).toBe("function");
    if (typeof throwOnError !== "function") {
      throw new Error("throwOnError는 predicate여야 합니다.");
    }

    expect(throwOnError(new HttpError(500), query)).toBe(true);
    expect(throwOnError(new HttpError(503), query)).toBe(true);
    expect(throwOnError(new HttpError(404), query)).toBe(false);
    expect(throwOnError(new Error("network unavailable"), query)).toBe(true);
  });
});
