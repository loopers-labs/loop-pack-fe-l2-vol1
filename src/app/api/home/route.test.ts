import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const request = (query = "") =>
  GET(new NextRequest(`http://localhost/api/home${query}`));

describe("홈 API 조회", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("정상 요청은 배너, 카테고리, 인기 상품과 신상품을 반환한다", async () => {
    const response = await request();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.banner).toEqual({
      title: "매일 새롭게 발견하는 취향",
      description: "지금 가장 사랑받는 상품을 만나보세요.",
      image: "/images/products/p6.jpg",
    });
    expect(body.categories).toEqual([
      { id: "casual", name: "캐주얼" },
      { id: "fashion", name: "패션" },
      { id: "goods", name: "뷰티·잡화" },
      { id: "home", name: "홈" },
      { id: "digital", name: "디지털" },
    ]);
    expect(body.popularProducts.map((product: { id: string }) => product.id)).toEqual([
      "p21",
      "p11",
      "p15",
      "p8",
      "p22",
      "p30",
    ]);
    expect(body.newProducts.map((product: { id: string }) => product.id)).toEqual([
      "p26",
      "p6",
      "p27",
      "p24",
      "p1",
      "p28",
    ]);
  });

  it("빈 시나리오에서도 배너와 카테고리를 유지하고 상품 목록만 비운다", async () => {
    const [normalResponse, emptyResponse] = await Promise.all([
      request(),
      request("?scenario=empty"),
    ]);
    const [normalBody, emptyBody] = await Promise.all([
      normalResponse.json(),
      emptyResponse.json(),
    ]);

    expect(emptyResponse.status).toBe(200);
    expect(emptyBody.banner).toEqual(normalBody.banner);
    expect(emptyBody.categories).toEqual(normalBody.categories);
    expect(emptyBody.popularProducts).toEqual([]);
    expect(emptyBody.newProducts).toEqual([]);
  });

  it("에러 시나리오는 500 상태와 고정된 오류 메시지를 반환한다", async () => {
    const response = await request("?scenario=error");
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ message: "홈 데이터를 불러오지 못했습니다." });
  });

  it("느린 시나리오는 1.5초 뒤 정상 데이터를 반환한다", async () => {
    vi.useFakeTimers();
    vi.stubEnv("NODE_ENV", "production");

    let settled = false;
    const responsePromise = request("?scenario=slow").then((response) => {
      settled = true;
      return response;
    });

    await vi.advanceTimersByTimeAsync(1_499);
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    const response = await responsePromise;
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.banner.image).toBe("/images/products/p6.jpg");
    expect(body.popularProducts).toHaveLength(6);
    expect(body.newProducts).toHaveLength(6);
  });

  it("알 수 없는 시나리오는 400 상태를 반환한다", async () => {
    const response = await request("?scenario=unknown");

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "요청 조건을 확인해주세요." });
  });
});
