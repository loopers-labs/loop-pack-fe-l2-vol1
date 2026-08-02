import { describe, expect, it } from "vitest";
import * as slice from "./index";
import type { Category, CategoryId, Product } from "./index";

describe("entities/product 배럴(index.ts)", () => {
  it("runtime export가 ProductCard와 isCategoryId다", () => {
    expect(Object.keys(slice).sort()).toEqual(["ProductCard", "isCategoryId"]);
    expect(typeof slice.ProductCard).toBe("function");
    expect(typeof slice.isCategoryId).toBe("function");
  });
});

type _ProductTypeContract = {
  category: Category;
  categoryId: CategoryId;
  product: Product;
};
