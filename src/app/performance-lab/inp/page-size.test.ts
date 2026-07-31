import { describe, expect, it } from "vitest";
import { resolveAdvancedAPageSize } from "./page-size";

describe("Advanced A page size", () => {
  it.each([undefined, "24", "1", "12", "48", "not-a-number"])(
    "preserves the 24-card fixture for pageSize=%s",
    (pageSize) => {
      expect(resolveAdvancedAPageSize(pageSize)).toBe(24);
    },
  );
});
