import { describe, expect, it } from "vitest";
import { assertProducts } from "./types";

function hasProducts(value: unknown): value is { products: unknown } {
  return typeof value === "object" && value !== null && "products" in value;
}

describe("GET /api/product-options (MSW handlers parity)", () => {
  it("route.ts와 동일한 shape의 products를 반환한다", async () => {
    const res = await fetch("/api/product-options");
    const body: unknown = await res.json();

    if (!hasProducts(body)) {
      throw new Error("응답에 products 필드가 없습니다.");
    }

    expect(() => assertProducts(body.products)).not.toThrow();
  });
});
