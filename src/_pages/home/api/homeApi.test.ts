import { afterEach, describe, expect, it, vi } from "vitest";
import { getHome } from "./homeApi";

describe("getHome", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("기본 환경에서는 normal home API를 호출한다", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(createHomeResponse());

    await getHome();

    expect(fetchMock).toHaveBeenCalledWith("/api/home");
  });

  it("slow 관찰 환경에서는 API 요청에만 slow scenario를 붙인다", async () => {
    vi.stubEnv("NEXT_PUBLIC_HOME_API_SCENARIO", "slow");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(createHomeResponse());

    await getHome();

    expect(fetchMock).toHaveBeenCalledWith("/api/home?scenario=slow");
  });
});

function createHomeResponse() {
  return new Response(
    JSON.stringify({
      banner: {
        title: "매일 새롭게 발견하는 취향",
        description: "지금 가장 사랑받는 상품을 만나보세요.",
        image: "/images/week-07/hero-original.jpg",
      },
      categories: [],
      popularProducts: [],
      newProducts: [],
    }),
  );
}
