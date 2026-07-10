import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { GET } from "./route";

const request = (query = "") =>
  GET(new NextRequest(`http://localhost/api/products${query}`));

const hugePositiveInteger = "9".repeat(400);

describe("GET /api/products", () => {
  it("preserves Week 04 defaults and adds paging metadata", async () => {
    const response = await request();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.products).toHaveLength(12);
    expect(body.categories).toHaveLength(5);
    expect(body.totalCount).toBe(30);
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(12);
    expect(body.products[0]).toMatchObject({
      id: "p1",
      name: "베이글 플레인",
      price: 3200,
      originalPrice: 4000,
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
      name: "에브리씽 베이글",
      price: 3800,
      originalPrice: null,
      image: "/images/products/p2.jpg",
      freeShipping: false,
      sizes: [],
    });

    const allCategoryBody = await (await request("?category=all&pageSize=24")).json();
    expect(allCategoryBody.totalCount).toBe(30);
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

  it("searches brand and name without case sensitivity", async () => {
    const response = await request("?q=%EB%A3%A8%ED%94%84&pageSize=24");
    const body = await response.json();
    expect(body.products.map((product: { id: string }) => product.id)).toEqual(["p1", "p2", "p26"]);

    const caseResponse = await request("?q=%20%204k%20%20&pageSize=24");
    const caseBody = await caseResponse.json();
    expect(caseBody.products.map((product: { id: string }) => product.id)).toEqual(["p24"]);
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
    expect(lowPriceBody.products[0].id).toBe("p1");

    const highPriceBody = await (await request("?sort=price-desc&pageSize=24")).json();
    expect(highPriceBody.products[0].id).toBe("p24");
  });

  it("returns an empty page when page exceeds the filtered result", async () => {
    const response = await request("?category=food&page=9&pageSize=12");
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.products).toEqual([]);
    expect(body.totalCount).toBe(6);
  });

  it.each([
    "?category=unknown",
    "?sort=random",
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

  it("supports deterministic empty and error scenarios", async () => {
    const emptyResponse = await request("?scenario=empty");
    const emptyBody = await emptyResponse.json();
    expect(emptyBody.products).toEqual([]);
    expect(emptyBody.categories).toHaveLength(5);

    const errorResponse = await request("?scenario=error");
    expect(errorResponse.status).toBe(500);
    expect(await errorResponse.json()).toEqual({ message: "상품 목록을 불러오지 못했습니다." });
  });
});
