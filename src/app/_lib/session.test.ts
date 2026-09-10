import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSessionToken } from "@/app/api/auth/session-token";
import { SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/app/api/auth/session-cookie";
import { requireServerSession, resolveServerSession } from "./session";

// mock 계정을 import 하지 않고 테스트가 기대값을 소유한다 — 계정이 바뀌면 여기서 드러나야 한다
const looper = (n: number) => ({ id: `u${n}`, name: `루퍼${n}`, email: `looper${n}@loopers.dev` });

const storeOf = (cookies: Record<string, string>) => ({
  get: (name: string) => (name in cookies ? { value: cookies[name] } : undefined),
});

const mocks = vi.hoisted(() => {
  const cookieJar: Record<string, string> = {};
  return {
    cookieJar,
    redirect: vi.fn((url: string) => {
      throw new Error(`REDIRECT:${url}`);
    }),
  };
});

vi.mock("next/headers", () => ({
  cookies: async () => storeOf(mocks.cookieJar),
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

describe("resolveServerSession", () => {
  it("쿠키가 없으면 로그인한 적 없는 상태다", () => {
    expect(resolveServerSession(storeOf({}))).toEqual({ hasCookie: false, user: null });
  });

  it("서명이 유효하고 만료 전이면 사용자를 돌려준다", () => {
    const now = Date.UTC(2026, 8, 3);
    const token = createSessionToken(looper(3).id, now);

    expect(resolveServerSession(storeOf({ [SESSION_COOKIE]: token }), now + 1_000)).toEqual({
      hasCookie: true,
      user: looper(3),
    });
  });

  it("만료된 쿠키는 '있지만 사용자 없음' 으로 구분된다", () => {
    const issued = Date.UTC(2026, 8, 3);
    const token = createSessionToken(looper(1).id, issued);

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

describe("requireServerSession", () => {
  beforeEach(() => {
    mocks.cookieJar = {};
    mocks.redirect.mockClear();
  });

  it("유효한 세션이면 사용자를 돌려준다", async () => {
    mocks.cookieJar = { [SESSION_COOKIE]: createSessionToken(looper(2).id) };

    await expect(requireServerSession("/orders")).resolves.toEqual(looper(2));
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("쿠키가 없으면 사유 없이 로그인으로 보낸다", async () => {
    await expect(requireServerSession("/orders")).rejects.toThrow("REDIRECT:/login?next=%2Forders");
  });

  it("쿠키가 있는데 검증에 실패하면 만료 사유를 붙인다", async () => {
    mocks.cookieJar = { [SESSION_COOKIE]: "tampered.token" };

    await expect(requireServerSession("/mypage")).rejects.toThrow(
      "REDIRECT:/login?next=%2Fmypage&reason=expired",
    );
  });

  it("쿼리스트링을 복원 경로에 그대로 싣는다", async () => {
    mocks.cookieJar = { [SESSION_COOKIE]: "tampered.token" };

    await expect(requireServerSession("/orders", { page: "2", sort: "latest" })).rejects.toThrow(
      "REDIRECT:/login?next=%2Forders%3Fpage%3D2%26sort%3Dlatest&reason=expired",
    );
  });

  it("같은 키가 여러 개인 쿼리도 잃지 않는다", async () => {
    await expect(requireServerSession("/orders", { tag: ["a", "b"] })).rejects.toThrow(
      "REDIRECT:/login?next=%2Forders%3Ftag%3Da%26tag%3Db",
    );
  });

  it("쿼리가 비어 있으면 물음표를 붙이지 않는다", async () => {
    await expect(requireServerSession("/orders", {})).rejects.toThrow(
      "REDIRECT:/login?next=%2Forders",
    );
  });
});
