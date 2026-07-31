import { describe, expect, it } from "vitest";
import {
  ADVANCED_A_CARD_COUNT,
  createAdvancedAProducts,
} from "./advanced-a-products";

describe("Advanced A product fixture", () => {
  it("keeps 24 deterministic cards for comparable profiling runs", () => {
    const firstRun = createAdvancedAProducts();
    const secondRun = createAdvancedAProducts();

    expect(ADVANCED_A_CARD_COUNT).toBe(24);
    expect(firstRun).toHaveLength(24);
    expect(secondRun).toEqual(firstRun);
    expect(new Set(firstRun.map((product) => product.id)).size).toBe(24);
    expect(firstRun[0]).toEqual({
      id: "week07-product-01",
      name: "에어리 데일리 셔츠 01",
      category: "상의",
      price: 32900,
      imageUrl: "/images/products/p1.jpg",
      calculationSeed: 1,
    });
    expect(firstRun.at(-1)).toEqual({
      id: "week07-product-24",
      name: "에어리 데일리 셔츠 24",
      category: "상의",
      price: 55900,
      imageUrl: "/images/products/p24.jpg",
      calculationSeed: 24,
    });
  });
});
