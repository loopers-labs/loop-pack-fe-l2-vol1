import { describe, expect, it } from "vitest";
import { accounts, createSessionToken } from "@/app/api/_data/auth";
import { SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/app/api/_data/auth-cookies";
import { resolveServerSession } from "./session";

const storeOf = (cookies: Record<string, string>) => ({
  get: (name: string) => (name in cookies ? { value: cookies[name] } : undefined),
});

describe("resolveServerSession", () => {
  it("쿠키가 없으면 로그인한 적 없는 상태다", () => {
    expect(resolveServerSession(storeOf({}))).toEqual({ hasCookie: false, user: null });
  });

  it("서명이 유효하고 만료 전이면 사용자를 돌려준다", () => {
    const now = Date.UTC(2026, 8, 3);
    const token = createSessionToken(accounts[2].id, now);

    expect(resolveServerSession(storeOf({ [SESSION_COOKIE]: token }), now + 1_000)).toEqual({
      hasCookie: true,
      user: accounts[2],
    });
  });

  it("만료된 쿠키는 '있지만 사용자 없음' 으로 구분된다", () => {
    const issued = Date.UTC(2026, 8, 3);
    const token = createSessionToken(accounts[0].id, issued);

    expect(
      resolveServerSession(
        storeOf({ [SESSION_COOKIE]: token }),
        issued + SESSION_TTL_SECONDS * 1_000,
      ),
    ).toEqual({ hasCookie: true, user: null });
  });

  it("위조된 쿠키도 '있지만 사용자 없음' 이다", () => {
    expect(resolveServerSession(storeOf({ [SESSION_COOKIE]: "abc.def" }))).toEqual({
      hasCookie: true,
      user: null,
    });
  });

  it("로그아웃으로 비워진 쿠키는 없는 것으로 본다", () => {
    expect(resolveServerSession(storeOf({ [SESSION_COOKIE]: "" }))).toEqual({
      hasCookie: false,
      user: null,
    });
  });
});
