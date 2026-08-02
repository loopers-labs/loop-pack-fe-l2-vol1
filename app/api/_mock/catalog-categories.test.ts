import { describe, expect, it } from "vitest";
import { isCategoryId } from "@/entities/product";
import { categories as mockCategories } from "./catalog";

describe("isCategoryId", () => {
  it("accepts every category id in the transitional mock catalog", () => {
    for (const category of mockCategories) {
      expect(isCategoryId(category.id)).toBe(true);
    }
  });
});
