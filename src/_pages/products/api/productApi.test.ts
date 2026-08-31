import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { server } from "@/shared/config/vitest/mswServer";
import { createMockProductListResponse } from "@/shared/testing/commerceFixtures";
import { getProducts } from "./productApi";

const TEST_API_ORIGIN = "http://test.local";

describe("getProducts", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("재현용 scenario가 있으면 API 요청 조건에 함께 붙인다", async () => {
    vi.stubEnv("APP_ORIGIN", TEST_API_ORIGIN);
    let requestedUrl: string | undefined;
    server.use(
      http.get(`${TEST_API_ORIGIN}/api/products`, ({ request }) => {
        requestedUrl = request.url;

        return HttpResponse.json(createMockProductListResponse());
      }),
    );

    await getProducts({
      q: "스탠리",
      category: "goods",
      sort: "popular",
      page: 2,
      pageSize: 12,
      scenario: "slow",
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

        return HttpResponse.json(createMockProductListResponse());
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
