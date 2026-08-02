import { describe, expect, it } from "vitest";
import * as slice from "./index";

describe("_app 배럴(index.ts)", () => {
  it("runtime export가 CommerceProviders 하나다", () => {
    expect(Object.keys(slice).sort()).toEqual(["CommerceProviders"]);
    expect(typeof slice.CommerceProviders).toBe("function");
  });
});
