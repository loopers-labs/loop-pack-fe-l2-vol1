import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { server } from "@/shared/config/vitest/mswServer";
import { createMockProductListResponse } from "@/shared/testing/commerceFixtures";
import { productQueries } from "./productQueries";
import type { ProductListQuery } from "../api/productApi";
import type { QueryFunctionContext } from "@tanstack/react-query";

const TEST_API_ORIGIN = "http://test.local";

describe("productQueries", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("상품 목록 query key는 조회 조건 전체를 포함한다", () => {
    const params = {
      q: "스탠리",
      category: "goods",
      sort: "popular",
      page: 2,
      pageSize: 12,
      scenario: "slow",
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
    expect(productQueries.serverList().throwOnError).toBe(false);
  });

  it("상품 목록 조회 결과는 클라이언트와 서버에서 같은 시간 동안 fresh 상태로 유지한다", () => {
    const expectedStaleTime = 1000 * 60;

    expect(productQueries.list().staleTime).toBe(expectedStaleTime);
    expect(productQueries.serverList().staleTime).toBe(expectedStaleTime);
  });

  it("상품 목록 queryFn은 요청 취소 signal을 API 요청에 전달한다", async () => {
    vi.stubEnv("APP_ORIGIN", TEST_API_ORIGIN);
    const abortController = new AbortController();
    const options = productQueries.list({
      category: "all",
      page: 1,
      pageSize: 12,
    });
    let didRequest = false;
    server.use(
      http.get(`${TEST_API_ORIGIN}/api/products`, () => {
        didRequest = true;

        return HttpResponse.json(createMockProductListResponse());
      }),
    );
    abortController.abort();

    await expect(
      options.queryFn?.({
        signal: abortController.signal,
        queryKey: options.queryKey,
        meta: undefined,
        client: {} as QueryFunctionContext["client"],
      }),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(didRequest).toBe(false);
  });

  it("서버 상품 목록 queryFn은 요청 취소 signal 없이 API 요청을 보낸다", async () => {
    vi.stubEnv("APP_ORIGIN", TEST_API_ORIGIN);
    const abortController = new AbortController();
    const options = productQueries.serverList({
      category: "all",
      page: 1,
      pageSize: 12,
    });
    let requestedUrl: string | undefined;
    server.use(
      http.get(`${TEST_API_ORIGIN}/api/products`, ({ request }) => {
        requestedUrl = request.url;

        return HttpResponse.json(createMockProductListResponse());
      }),
    );
    abortController.abort();

    await options.queryFn?.({
      signal: abortController.signal,
      queryKey: options.queryKey,
      meta: undefined,
      client: {} as QueryFunctionContext["client"],
    });

    expect(requestedUrl).toBe(`${TEST_API_ORIGIN}/api/products?category=all&page=1&pageSize=12`);
  });
});
