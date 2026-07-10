import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { GET } from "./route";

const request = (query = "") =>
  GET(new NextRequest(`http://localhost/api/home${query}`));

describe("GET /api/home", () => {
  it("returns banner, categories, popular products, and new products", async () => {
    const response = await request();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.banner.title).toBe("매일 새롭게 발견하는 취향");
    expect(body.categories).toEqual([
      { id: "casual", name: "캐주얼" },
      { id: "fashion", name: "패션" },
      { id: "goods", name: "뷰티·잡화" },
      { id: "home", name: "홈" },
      { id: "digital", name: "디지털" },
    ]);
    expect(body.popularProducts).toHaveLength(6);
    expect(body.newProducts).toHaveLength(6);
    expect(body.popularProducts[0].id).toBe("p21");
    expect(body.newProducts[0].id).toBe("p26");
  });

  it("keeps banner and categories in the empty scenario", async () => {
    const response = await request("?scenario=empty");
    const body = await response.json();
    expect(body.banner).toBeDefined();
    expect(body.categories).toHaveLength(5);
    expect(body.popularProducts).toEqual([]);
    expect(body.newProducts).toEqual([]);
  });

  it("returns a deterministic error scenario", async () => {
    const response = await request("?scenario=error");
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ message: "홈 데이터를 불러오지 못했습니다." });
  });

  it("rejects an unknown scenario", async () => {
    const response = await request("?scenario=unknown");

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "요청 조건을 확인해주세요." });
  });
});
