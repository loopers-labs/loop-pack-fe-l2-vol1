// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SessionUser } from "@/entities/session/model/types";
import { AnalyticsSessionSync } from "@/features/analytics/ui/AnalyticsSessionSync";
import { looperUser, withSession } from "@/test/session";

// 로거의 identify/reset과 공통 프로퍼티의 setAnalyticsUser를 감시한다.
const identify = vi.hoisted(() => vi.fn());
const reset = vi.hoisted(() => vi.fn());
const setAnalyticsUser = vi.hoisted(() => vi.fn());
vi.mock("@/analytics/logger", () => ({ identify, reset }));
vi.mock("@/analytics/session", () => ({ setAnalyticsUser }));

const USER = looperUser(1);

const USER2 = looperUser(2);

function tree(user: SessionUser | null) {
  return withSession(user, <AnalyticsSessionSync />);
}

// 세션 상태를 바꿔 다시 렌더한다(로그인↔로그아웃 전환 재현).
function renderWithUser(user: SessionUser | null) {
  return render(tree(user));
}

afterEach(() => vi.clearAllMocks());

describe("AnalyticsSessionSync — 로그인 상태 4조합", () => {
  it("로그인 상태: userId로 identify하고 공통 프로퍼티에 userId를 설정한다", () => {
    renderWithUser(USER);

    expect(identify).toHaveBeenCalledExactlyOnceWith("u1");
    expect(setAnalyticsUser).toHaveBeenCalledExactlyOnceWith("u1");
    expect(reset).not.toHaveBeenCalled();
  });

  it("로그아웃(비로그인) 상태: reset하고 공통 프로퍼티의 userId를 비운다", () => {
    renderWithUser(null);

    expect(reset).toHaveBeenCalledOnce();
    expect(setAnalyticsUser).toHaveBeenCalledExactlyOnceWith(null);
    expect(identify).not.toHaveBeenCalled();
  });

  it("로그인 → 로그아웃 전환: identify 후 reset이 뒤따르고, userId가 설정됐다 비워진다", () => {
    const { rerender } = renderWithUser(USER);
    expect(identify).toHaveBeenCalledWith("u1");

    rerender(tree(null));

    expect(reset).toHaveBeenCalledOnce();
    // 마지막 setAnalyticsUser 호출이 null이어야 한다(이전 u1이 낡은 채로 남지 않는다).
    expect(setAnalyticsUser).toHaveBeenLastCalledWith(null);
  });

  it("로그아웃 → 로그인 전환: reset 후 identify가 뒤따르고, userId가 비었다가 설정된다", () => {
    const { rerender } = renderWithUser(null);
    expect(reset).toHaveBeenCalledOnce();

    rerender(tree(USER));

    expect(identify).toHaveBeenCalledWith("u1");
    expect(setAnalyticsUser).toHaveBeenLastCalledWith("u1");
  });

  it("같은 유저로 다시 렌더하면 identify를 중복 호출하지 않는다", () => {
    const { rerender } = renderWithUser(USER);
    expect(identify).toHaveBeenCalledOnce();

    // 같은 user 참조로 재렌더 — [user] deps가 안 바뀌어 effect가 재실행되지 않는다.
    rerender(tree(USER));

    expect(identify).toHaveBeenCalledOnce();
  });

  it("로그아웃 없이 다른 유저로 바뀌면 새 userId로 identify한다", () => {
    const { rerender } = renderWithUser(USER);
    expect(identify).toHaveBeenLastCalledWith("u1");

    rerender(tree(USER2));

    expect(identify).toHaveBeenLastCalledWith("u2");
    expect(setAnalyticsUser).toHaveBeenLastCalledWith("u2");
  });

  it("로그인(u1) → 로그아웃 → 같은 유저(u1) 재로그인: 최종 u1, identify 2회·reset 1회", () => {
    const { rerender } = renderWithUser(USER);
    rerender(tree(null));
    rerender(tree(USER));

    expect(identify).toHaveBeenLastCalledWith("u1");
    expect(setAnalyticsUser).toHaveBeenLastCalledWith("u1");
    expect(identify).toHaveBeenCalledTimes(2);
    expect(reset).toHaveBeenCalledOnce();
  });

  it("로그인(u1) → 로그아웃 → 다른 유저(u2) 로그인: 최종 u2, 이전 u1이 낡은 채 남지 않는다", () => {
    const { rerender } = renderWithUser(USER);
    rerender(tree(null));
    rerender(tree(USER2));

    expect(identify).toHaveBeenLastCalledWith("u2");
    expect(setAnalyticsUser).toHaveBeenLastCalledWith("u2");
    expect(reset).toHaveBeenCalledOnce();
  });
});
