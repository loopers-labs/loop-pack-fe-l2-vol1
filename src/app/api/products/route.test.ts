import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { GET } from "./route";

const request = (query = "") =>
  GET(new NextRequest(`http://localhost/api/products${query}`));

const hugePositiveInteger = "9".repeat(400);

describe("GET /api/products", () => {
  it("preserves Week 04 field shape while using the mapped source identity", async () => {
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
      brand: "29CM 셀렉트",
      name: "Basic Fit Ball Cap (6color)",
      category: "casual",
      price: 39000,
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
      brand: "29CM 셀렉트",
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

  it("matches representative source products across all five image groups", async () => {
    const body = await (await request("?pageSize=24")).json();
    const secondPageBody = await (await request("?page=2&pageSize=24")).json();
    const products = [...body.products, ...secondPageBody.products];

    expect(products.filter((product: { id: string }) => ["p1", "p6", "p11", "p16", "p21"].includes(product.id)))
      .toMatchObject([
        { id: "p1", name: "Basic Fit Ball Cap (6color)", category: "casual", price: 39000 },
        { id: "p6", name: "WOMAN GNRL 케이블 풀오버 [IVORY] / WBC3L05502", category: "fashion", price: 69000 },
        { id: "p11", name: "하이드레이팅 나이트 립 마스크 25g + 소프트 글로우 결 토너 210ml", category: "goods", price: 48000 },
        { id: "p16", name: "스탠리 클래식 런치박스", category: "home", price: 75000 },
        { id: "p21", name: "메이커스 투명케이스", category: "digital", price: 23000 },
      ]);
    expect(products.every((product: { brand: string; originalPrice: number | null }) =>
      product.brand === "29CM 셀렉트" && product.originalPrice === null,
    )).toBe(true);
  });

  it("returns one unique local image for every product", async () => {
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

  it("searches the shared brand and source name without case sensitivity", async () => {
    const response = await request("?q=29cm%20%EC%85%80%EB%A0%89%ED%8A%B8&pageSize=24");
    const body = await response.json();
    expect(body.totalCount).toBe(30);

    const caseResponse = await request("?q=%20%20basic%20fit%20%20&pageSize=24");
    const caseBody = await caseResponse.json();
    expect(caseBody.products.map((product: { id: string }) => product.id)).toEqual(["p1"]);
  });

  it("filters category and sorts popularity deterministically", async () => {
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
  });

  it("sorts latest and price order explicitly", async () => {
    const latestBody = await (await request("?sort=latest&pageSize=24")).json();
    expect(latestBody.products[0].id).toBe("p26");

    const lowPriceBody = await (await request("?sort=price-asc&pageSize=24")).json();
    expect(lowPriceBody.products[0]).toMatchObject({ id: "p29", price: 3000 });

    const highPriceBody = await (await request("?sort=price-desc&pageSize=24")).json();
    expect(highPriceBody.products[0]).toMatchObject({ id: "p7", price: 428000 });
  });

  it("returns an empty page when page exceeds the filtered result", async () => {
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
  ])("rejects invalid query %s", async (query) => {
    const response = await request(query);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "요청 조건을 확인해주세요." });
  });

  it("validates request inputs before applying the error scenario", async () => {
    const response = await request("?scenario=error&page=0");

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "요청 조건을 확인해주세요." });
  });

  it("supports deterministic empty and error scenarios", async () => {
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
});
