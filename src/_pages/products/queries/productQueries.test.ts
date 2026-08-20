import { afterEach, describe, expect, it, vi } from "vitest";
import { productQueries } from "./productQueries";
import type { ProductListQuery } from "../api/productApi";
import type { QueryFunctionContext } from "@tanstack/react-query";

describe("productQueries", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it("서버 상품 목록 query key도 클라이언트 목록과 같은 조회 조건을 사용한다", () => {
    const params = {
      q: "스탠리",
      category: "goods",
      sort: "popular",
      page: 2,
      pageSize: 12,
    } satisfies ProductListQuery;

    expect(productQueries.serverList(params).queryKey).toEqual(
      productQueries.list(params).queryKey,
    );
  });

  it("상품 목록 조회 실패는 Error Boundary로 전파하지 않는다", () => {
    expect(productQueries.list().throwOnError).toBe(false);
  });

  it("상품 목록 queryFn은 요청 취소 signal을 API 요청에 전달한다", async () => {
    const abortController = new AbortController();
    const options = productQueries.list({
      category: "all",
      page: 1,
      pageSize: 12,
    });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          products: [],
          categories: [],
          totalCount: 0,
          page: 1,
          pageSize: 12,
        }),
      ),
    );

    await options.queryFn?.({
      signal: abortController.signal,
      queryKey: options.queryKey,
      meta: undefined,
      client: {} as QueryFunctionContext["client"],
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/products?category=all&page=1&pageSize=12", {
      signal: abortController.signal,
    });
  });

  it("서버 상품 목록 queryFn은 요청 취소 signal 없이 API 요청을 보낸다", async () => {
    const abortController = new AbortController();
    const options = productQueries.serverList({
      category: "all",
      page: 1,
      pageSize: 12,
    });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          products: [],
          categories: [],
          totalCount: 0,
          page: 1,
          pageSize: 12,
        }),
      ),
    );

    await options.queryFn?.({
      signal: abortController.signal,
      queryKey: options.queryKey,
      meta: undefined,
      client: {} as QueryFunctionContext["client"],
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/products?category=all&page=1&pageSize=12");
  });
});
