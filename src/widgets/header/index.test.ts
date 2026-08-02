import { describe, expect, it } from "vitest";
import * as slice from "./index";

const RUNTIME_EXPORT_NAMES = ["Header"];

describe("widgets/header 배럴(index.ts)", () => {
  it("런타임 export가 정확히 Header 하나다", () => {
    expect(Object.keys(slice).sort()).toEqual([...RUNTIME_EXPORT_NAMES].sort());
  });

  it("Header는 함수다", () => {
    expect(typeof slice.Header).toBe("function");
  });
});
