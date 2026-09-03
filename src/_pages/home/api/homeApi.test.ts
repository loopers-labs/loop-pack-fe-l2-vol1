import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { server } from "@/shared/config/vitest/mswServer";
import { getHome } from "./homeApi";

const TEST_API_ORIGIN = "http://test.local";

describe("getHome", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("기본 환경에서는 normal home API를 호출한다", async () => {
    vi.stubEnv("APP_ORIGIN", TEST_API_ORIGIN);
    let requestedUrl: string | undefined;
    server.use(
      http.get(`${TEST_API_ORIGIN}/api/home`, ({ request }) => {
        requestedUrl = request.url;

        return HttpResponse.json(createHomeResponse());
      }),
    );

    await getHome();

    expect(requestedUrl).toBe(`${TEST_API_ORIGIN}/api/home`);
  });

  it("slow 관찰 환경에서는 API 요청에만 slow scenario를 붙인다", async () => {
    vi.stubEnv("APP_ORIGIN", TEST_API_ORIGIN);
    vi.stubEnv("NEXT_PUBLIC_HOME_API_SCENARIO", "slow");
    let requestedUrl: string | undefined;
    server.use(
      http.get(`${TEST_API_ORIGIN}/api/home`, ({ request }) => {
        requestedUrl = request.url;

        return HttpResponse.json(createHomeResponse());
      }),
    );

    await getHome();

    expect(requestedUrl).toBe(`${TEST_API_ORIGIN}/api/home?scenario=slow`);
  });
});

function createHomeResponse() {
  return {
    banner: {
      title: "매일 새롭게 발견하는 취향",
      description: "지금 가장 사랑받는 상품을 만나보세요.",
      image: "/images/week-07/hero-original.jpg",
    },
    categories: [],
    popularProducts: [],
    newProducts: [],
  };
}
