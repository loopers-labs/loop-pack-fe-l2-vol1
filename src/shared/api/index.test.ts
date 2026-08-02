import { describe, expect, it } from "vitest";
import * as slice from "./index";
import type { ApiErrorResponse } from "./index";

describe("shared/api 배럴(index.ts)", () => {
  it("runtime export가 fetchJson 하나다", () => {
    expect(Object.keys(slice).sort()).toEqual(["fetchJson"]);
    expect(typeof slice.fetchJson).toBe("function");
  });
});

type _ApiTypeContract = ApiErrorResponse;
