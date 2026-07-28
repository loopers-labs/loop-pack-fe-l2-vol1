// @vitest-environment node
// Advanced B 요구 1

import { describe, expect, test } from "vitest";
import { getQueryClient } from "@/lib/queryClient";

describe("getQueryClient — 서버(node)", () => {
  test("요구1: 서버에서는 호출(=요청)마다 새 QueryClient 를 만든다 (다른 사용자에게 누수되지않게 캐시 격리)", () => {
    expect(getQueryClient()).not.toBe(getQueryClient());
  });
});
