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

describe("proxy 접근 가드", () => {
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

  it("미로그인으로 /login → 통과", () => {
    expect(proxy(guest("/login")).headers.get("location")).toBeNull();
  });

  it("로그인 상태로 /login → redirectUrl 로 되돌려보낸다", () => {
    const url = new URL(
      proxy(member("/login?redirectUrl=%2Forders")).headers.get("location")!,
    );
    expect(url.pathname).toBe("/orders");
  });

  it("로그인 상태로 /login, redirectUrl 없으면 홈으로", () => {
    const url = new URL(proxy(member("/login")).headers.get("location")!);
    expect(url.pathname).toBe("/");
  });

  it("로그인 상태로 /login, 외부 주소 redirectUrl 은 홈으로 접는다", () => {
    const url = new URL(
      proxy(member("/login?redirectUrl=%2F%2Fevil.com")).headers.get(
        "location",
      )!,
    );
    expect(url.origin).toBe(BASE);
    expect(url.pathname).toBe("/");
  });
});
