import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";
import { accounts, createSessionToken } from "@/app/api/_data/auth";
import { SESSION_COOKIE } from "@/app/api/_data/auth-cookies";

const BASE = "https://example.test";

const guest = (path: string) => new NextRequest(new URL(path, BASE));

const member = (path: string) =>
  new NextRequest(new URL(path, BASE), {
    headers: {
      cookie: `${SESSION_COOKIE}=${createSessionToken(accounts[0].id)}`,
    },
  });

describe("proxy 보호 경로 가드", () => {
  it("미로그인으로 보호 경로 → 로그인으로, 원래 경로를 redirectUrl 로 싣는다", () => {
    const url = new URL(
      proxy(guest("/orders/new?x=1")).headers.get("location")!,
    );
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("redirectUrl")).toBe("/orders/new?x=1");
  });

  it("로그인 상태로 보호 경로 → 통과(리다이렉트 없음)", () => {
    expect(proxy(member("/orders")).headers.get("location")).toBeNull();
  });
});
