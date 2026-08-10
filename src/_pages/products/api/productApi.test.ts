import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { server } from "@/shared/config/vitest/mswServer";
import { getProducts } from "./productApi";

const TEST_API_ORIGIN = "http://test.local";

describe("getProducts", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("slow 관찰 환경에서는 사용자 조회 조건과 별개로 API 요청에만 slow scenario를 붙인다", async () => {
    vi.stubEnv("APP_ORIGIN", TEST_API_ORIGIN);
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_API_SCENARIO", "slow");
    let requestedUrl: string | undefined;
    server.use(
      http.get(`${TEST_API_ORIGIN}/api/products`, ({ request }) => {
        requestedUrl = request.url;

        return HttpResponse.json(createProductListResponse());
      }),
    );

    await getProducts({
      q: "스탠리",
      category: "goods",
      sort: "popular",
      page: 2,
      pageSize: 12,
    });

    expect(requestedUrl).toBe(
      `${TEST_API_ORIGIN}/api/products?q=%EC%8A%A4%ED%83%A0%EB%A6%AC&category=goods&sort=popular&page=2&pageSize=12&scenario=slow`,
    );
  });

  it("요청 취소를 위해 AbortSignal을 fetch에 전달한다", async () => {
    vi.stubEnv("APP_ORIGIN", TEST_API_ORIGIN);
    const abortController = new AbortController();
    let didRequest = false;
    server.use(
      http.get(`${TEST_API_ORIGIN}/api/products`, () => {
        didRequest = true;

        return HttpResponse.json(createProductListResponse());
      }),
    );
    abortController.abort();

    await expect(
      getProducts(
        {
          category: "all",
          page: 1,
          pageSize: 12,
        },
        { signal: abortController.signal },
      ),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(didRequest).toBe(false);
  });
});

function createProductListResponse() {
  return {
    products: [],
    categories: [],
    totalCount: 0,
    page: 1,
    pageSize: 12,
  };
}
