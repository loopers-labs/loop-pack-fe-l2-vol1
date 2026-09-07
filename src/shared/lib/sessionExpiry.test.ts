// 세션 만료 판정·신호 단위 테스트.
// - isSessionExpiry: 입력→출력 계약만 검증(세 조건 모두 참일 때만 만료).
// - 신호 버스: 구독/발신/해지의 관찰 가능한 동작만 검증(spy 호출 횟수). 내부 Set 은 건드리지 않는다.

import { afterEach, describe, expect, test, vi } from "vitest";
import {
  isSessionExpiry,
  notifySessionExpired,
  onSessionExpired,
} from "@/shared/lib";

describe("isSessionExpiry — 401·인증쿼리·이전데이터가 모두 참일 때만 만료", () => {
  test("세 조건이 모두 참이면 만료(true)", () => {
    expect(
      isSessionExpiry({ status: 401, isAuthGuarded: true, hadData: true }),
    ).toBe(true);
  });

  test.each<{
    label: string;
    status: number | undefined;
    isAuthGuarded: boolean;
    hadData: boolean;
  }>([
    { label: "status 가 200", status: 200, isAuthGuarded: true, hadData: true },
    { label: "status 가 500", status: 500, isAuthGuarded: true, hadData: true },
    { label: "status 가 403", status: 403, isAuthGuarded: true, hadData: true },
    {
      label: "status 가 undefined(네트워크 오류 등)",
      status: undefined,
      isAuthGuarded: true,
      hadData: true,
    },
    {
      label: "인증 가드 쿼리가 아님",
      status: 401,
      isAuthGuarded: false,
      hadData: true,
    },
    {
      label: "이전 데이터가 없음(첫 로드 401 = 미로그인)",
      status: 401,
      isAuthGuarded: true,
      hadData: false,
    },
  ])("$label 이면 만료 아님(false)", ({ status, isAuthGuarded, hadData }) => {
    expect(isSessionExpiry({ status, isAuthGuarded, hadData })).toBe(false);
  });
});

describe("세션 만료 신호 버스 — 구독/발신/해지 관찰 가능 동작", () => {
  // 리스너 Set 은 모듈 전역이라 테스트마다 새로 붙인 리스너를 반드시 떼어 누수를 막는다.
  const unsubscribes: Array<() => void> = [];

  afterEach(() => {
    for (const unsubscribe of unsubscribes) unsubscribe();

    unsubscribes.length = 0;
  });

  function subscribe(listener: () => void): () => void {
    const unsubscribe = onSessionExpired(listener);
    unsubscribes.push(unsubscribe);

    return unsubscribe;
  }

  test("발신하면 구독된 리스너가 호출된다", () => {
    const listener = vi.fn();
    subscribe(listener);

    notifySessionExpired();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  test("여러 리스너가 모두 호출된다", () => {
    const first = vi.fn();
    const second = vi.fn();
    subscribe(first);
    subscribe(second);

    notifySessionExpired();

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  test("해지 함수를 호출하면 이후 발신에서 그 리스너는 호출되지 않는다", () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);

    unsubscribe();
    notifySessionExpired();

    expect(listener).not.toHaveBeenCalled();
  });
});
