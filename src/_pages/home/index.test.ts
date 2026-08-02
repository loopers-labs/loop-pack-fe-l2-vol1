import { describe, expect, it } from "vitest";
import * as slice from "./index";
import type { HomeResponse } from "./index";

describe("_pages/home 배럴(index.ts)", () => {
  it("runtime export가 HomeView와 homeQueryOptions다", () => {
    expect(Object.keys(slice).sort()).toEqual(["HomeView", "homeQueryOptions"]);
    expect(typeof slice.HomeView).toBe("function");
    expect(typeof slice.homeQueryOptions).toBe("function");
  });
});

type _HomeTypeContract = HomeResponse;
