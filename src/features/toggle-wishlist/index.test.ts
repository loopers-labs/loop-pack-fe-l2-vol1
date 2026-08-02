import { describe, expect, it } from "vitest";
import * as slice from "./index";

const RUNTIME_EXPORT_NAMES = ["WishlistToggleButton", "useWishlistCount"] as const;

describe("features/toggle-wishlist 배럴(index.ts)", () => {
  it("런타임 export 집합이 정확히 일치해 내부 store를 노출하지 않는다", () => {
    expect(Object.keys(slice).sort()).toEqual([...RUNTIME_EXPORT_NAMES].sort());
  });

  it.each(RUNTIME_EXPORT_NAMES)("공개 runtime export %s는 함수다", (name) => {
    expect(typeof slice[name]).toBe("function");
  });
});
