// @vitest-environment node
import { describe, expect, it } from "vitest";

import { assertProducts } from "@/products/api/types";

import { GET } from "./route";

describe("GET /api/product-options", () => {
  it("returns 3 products with totalCount 3", async () => {
    const res = await GET();
    const body = await res.json();

    expect(body.products).toHaveLength(3);
    expect(body.totalCount).toBe(3);
  });

  it("returns each product with a valid optionKind and options carrying an id", async () => {
    const res = await GET();
    const body = await res.json();

    const optionKinds = body.products.map((product: { optionKind: string }) => product.optionKind);
    expect(optionKinds).toEqual(["size", "thumbnail", "bundle"]);

    for (const product of body.products) {
      for (const option of product.options) {
        expect(typeof option.id).toBe("string");
      }
    }
  });

  it("includes at least one sold-out option (stock 0)", async () => {
    const res = await GET();
    const body = await res.json();

    const allOptions = body.products.flatMap(
      (product: { options: { stock: number }[] }) => product.options,
    );
    const soldOutOptions = allOptions.filter((option: { stock: number }) => option.stock === 0);

    expect(soldOutOptions.length).toBeGreaterThanOrEqual(1);
  });

  it("serves products that pass assertProducts self-validation", async () => {
    const res = await GET();
    const body = await res.json();

    expect(() => assertProducts(body.products)).not.toThrow();
  });
});
