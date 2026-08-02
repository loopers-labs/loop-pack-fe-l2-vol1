import { describe, expect, it } from "vitest";
import { categories as mockCategories } from "@/commerce/api/catalog";
import { isCategoryId } from "./categories";

describe("isCategoryId", () => {
  it("accepts every category id in the transitional mock catalog", () => {
    for (const category of mockCategories) {
      expect(isCategoryId(category.id)).toBe(true);
    }
  });
});
