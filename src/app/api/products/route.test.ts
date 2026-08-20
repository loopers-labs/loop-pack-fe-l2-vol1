import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const request = (query = "") =>
  GET(new NextRequest(`http://localhost/api/products${query}`));

const hugePositiveInteger = "9".repeat(400);

describe("상품 API 조회", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("상품 ID가 존재하면 상품 하나를 반환한다", async () => {
    const response = await request("?id=p1");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      id: "p1",
      brand: "Loopers Select",
      name: "[11월 20일 예약배송] Winter Rocky Pants 2color 윈터 로키팬츠 OG",
      category: "casual",
      price: 79000,
    });
    expect(body.products).toBeUndefined();
  });

  it("상품 ID가 존재하지 않으면 404 상태를 반환한다", async () => {
    const response = await request("?id=missing-product");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      message: "상품을 찾을 수 없습니다.",
    });
  });

  it("목록 응답은 기존 상품 필드와 매핑된 상품 정보를 유지한다", async () => {
    const response = await request();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.products).toHaveLength(12);
    expect(body.categories).toHaveLength(5);
    expect(body.categories).toEqual([
      { id: "casual", name: "캐주얼" },
      { id: "fashion", name: "패션" },
      { id: "goods", name: "뷰티·잡화" },
      { id: "home", name: "홈" },
      { id: "digital", name: "디지털" },
    ]);
    expect(body.totalCount).toBe(30);
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(12);
    expect(body.products[0]).toMatchObject({
      id: "p1",
      brand: "Loopers Select",
      name: "[11월 20일 예약배송] Winter Rocky Pants 2color 윈터 로키팬츠 OG",
      category: "casual",
      price: 79000,
      originalPrice: null,
      image: "/images/products/p1.jpg",
      freeShipping: true,
      sizes: [
        { value: 24, stock: 3 },
        { value: 25, stock: 0 },
        { value: 26, stock: 12 },
        { value: 27, stock: 5 },
        { value: 28, stock: 0 },
      ],
    });
    expect(body.products[1]).toMatchObject({
      id: "p2",
      brand: "Loopers Select",
      name: "[Exclusive] Holiday Signature Ball Cap (20Colors)",
      category: "casual",
      price: 39000,
      originalPrice: null,
      image: "/images/products/p2.jpg",
      freeShipping: false,
      sizes: [],
    });

    const allCategoryBody = await (await request("?category=all&pageSize=24")).json();
    expect(allCategoryBody.totalCount).toBe(30);
  });

  it("다섯 이미지 그룹의 대표 상품 정보를 반환한다", async () => {
    const body = await (await request("?pageSize=24")).json();
    const secondPageBody = await (await request("?page=2&pageSize=24")).json();
    const products = [...body.products, ...secondPageBody.products];

    expect(products.filter((product: { id: string }) => ["p1", "p6", "p11", "p16", "p21"].includes(product.id)))
      .toMatchObject([
        {
          id: "p1",
          brand: "Loopers Select",
          name: "[11월 20일 예약배송] Winter Rocky Pants 2color 윈터 로키팬츠 OG",
          category: "casual",
          price: 79000,
          originalPrice: null,
        },
        { id: "p6", name: "WOMAN GNRL 케이블 풀오버 [IVORY] / WBC3L05502", category: "fashion", price: 69000 },
        { id: "p11", brand: "인스테드", name: "하이드레이팅 나이트 립 마스크 25g + 소프트 글로우 결 토너 210ml", category: "goods", price: 48000, originalPrice: 58000 },
        { id: "p16", brand: "스탠리", name: "스탠리 클래식 런치박스", category: "home", price: 75000, originalPrice: 89000 },
        { id: "p21", brand: "메이커스", name: "메이커스 투명케이스", category: "digital", price: 23000, originalPrice: 29000 },
      ]);
  });

  it("모든 상품은 서로 다른 로컬 이미지를 사용한다", async () => {
    const firstPageBody = await (await request("?pageSize=24")).json();
    const secondPageBody = await (await request("?pageSize=24&page=2")).json();
    const products = [...firstPageBody.products, ...secondPageBody.products];
    const images = products.map((product: { image: string }) => product.image);

    expect(products).toHaveLength(30);
    images.forEach((image: string) => {
      expect(image).toMatch(/^\/images\/products\/p\d+\.jpg$/);
    });
    expect(new Set(images).size).toBe(30);
    expect(images.some((image: string) => image.startsWith("http"))).toBe(false);
  });

  it("브랜드와 상품명을 공백과 영문 대소문자에 관계없이 검색한다", async () => {
    const response = await request("?q=%EC%8A%A4%ED%83%A0%EB%A6%AC&pageSize=24");
    const body = await response.json();
    expect(body.products.map((product: { id: string }) => product.id)).toEqual([
      "p16",
      "p17",
      "p19",
      "p20",
    ]);

    const caseResponse = await request("?q=%20%20winter%20rocky%20%20&pageSize=24");
    const caseBody = await caseResponse.json();
    expect(caseBody.products.map((product: { id: string }) => product.id)).toEqual(["p1"]);
  });

  it("카테고리로 필터링하고 인기순 동률은 평점으로 정렬한다", async () => {
    const response = await request("?category=digital&sort=popular&pageSize=24");
    const body = await response.json();
    expect(body.products.map((product: { id: string }) => product.id)).toEqual([
      "p21",
      "p22",
      "p30",
      "p23",
      "p25",
      "p24",
    ]);
    expect(
      body.products
        .filter((product: { id: string }) => ["p22", "p30"].includes(product.id))
        .map((product: { id: string; rating: number; reviewCount: number }) => ({
          id: product.id,
          rating: product.rating,
          reviewCount: product.reviewCount,
        })),
    ).toEqual([
      { id: "p22", rating: 4.6, reviewCount: 689 },
      { id: "p30", rating: 4.5, reviewCount: 689 },
    ]);
  });

  it("필터 결과의 마지막 페이지를 넘으면 빈 목록과 전체 개수를 반환한다", async () => {
    const response = await request("?category=casual&page=9&pageSize=12");
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.products).toEqual([]);
    expect(body.totalCount).toBe(6);
  });

  it.each([
    "?category=unknown",
    "?category=food",
    "?category=beauty",
    "?sort=random",
    "?scenario=unknown",
    "?page=0",
    "?page=-1",
    "?page=1.5",
    "?pageSize=0",
    "?pageSize=25",
    "?pageSize=1.5",
    `?page=${hugePositiveInteger}`,
    `?pageSize=${hugePositiveInteger}`,
  ])("잘못된 요청 조건 %s는 400 상태로 거부한다", async (query) => {
    const response = await request(query);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "요청 조건을 확인해주세요." });
  });

  it("에러 시나리오보다 요청 조건 검증을 먼저 적용한다", async () => {
    const response = await request("?scenario=error&page=0");

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "요청 조건을 확인해주세요." });
  });

  it("빈 시나리오는 빈 목록을, 에러 시나리오는 500 상태를 반환한다", async () => {
    const emptyResponse = await request(
      "?scenario=empty&category=digital&page=2&pageSize=3",
    );
    const emptyBody = await emptyResponse.json();

    expect(emptyResponse.status).toBe(200);
    expect(emptyBody.products).toEqual([]);
    expect(emptyBody.totalCount).toBe(0);
    expect(emptyBody.categories).toEqual([
      { id: "casual", name: "캐주얼" },
      { id: "fashion", name: "패션" },
      { id: "goods", name: "뷰티·잡화" },
      { id: "home", name: "홈" },
      { id: "digital", name: "디지털" },
    ]);
    expect(emptyBody.page).toBe(2);
    expect(emptyBody.pageSize).toBe(3);

    const errorResponse = await request("?scenario=error");
    expect(errorResponse.status).toBe(500);
    expect(await errorResponse.json()).toEqual({ message: "상품 목록을 불러오지 못했습니다." });
  });

  it("느린 시나리오는 1.5초 뒤 정상 상품 목록을 반환한다", async () => {
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
    expect(body.products).toHaveLength(12);
    expect(body.totalCount).toBe(30);
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(12);
  });
});
