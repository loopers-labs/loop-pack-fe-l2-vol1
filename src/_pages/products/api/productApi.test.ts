import { afterEach, describe, expect, it, vi } from "vitest";
import { getProducts } from "./productApi";

describe("getProducts", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("slow 관찰 환경에서는 사용자 조회 조건과 별개로 API 요청에만 slow scenario를 붙인다", async () => {
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_API_SCENARIO", "slow");
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

    await getProducts({
      q: "스탠리",
      category: "goods",
      sort: "popular",
      page: 2,
      pageSize: 12,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/products?q=%EC%8A%A4%ED%83%A0%EB%A6%AC&category=goods&sort=popular&page=2&pageSize=12&scenario=slow",
    );
  });
});
