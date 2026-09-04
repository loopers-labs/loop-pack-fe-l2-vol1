// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getCommonProperties, setAnalyticsUser } from "@/analytics/session";

beforeEach(() => {
  sessionStorage.clear();
  setAnalyticsUser(null);
  // jsdom엔 matchMedia가 없다. device 판별용으로 desktop을 반환하게 최소 구현한다.
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: false })),
  );
});
afterEach(() => setAnalyticsUser(null));

describe("공통 프로퍼티", () => {
  it("sessionId·device·ts를 담고, 로그인 전에는 userId가 없다", () => {
    const props = getCommonProperties();

    expect(typeof props.sessionId).toBe("string");
    expect(props.device).toBeDefined();
    expect(typeof props.ts).toBe("string");
    expect(props).not.toHaveProperty("userId");
  });

  it("sessionId는 같은 세션 동안 안정적이다", () => {
    const first = getCommonProperties().sessionId;
    const second = getCommonProperties().sessionId;

    expect(second).toBe(first);
  });

  it("setAnalyticsUser로 설정하면 이후 이벤트에 userId가 붙는다", () => {
    setAnalyticsUser("u1");
    expect(getCommonProperties().userId).toBe("u1");
  });

  it("setAnalyticsUser(null)이면 userId가 다시 빠진다", () => {
    setAnalyticsUser("u1");
    setAnalyticsUser(null);
    expect(getCommonProperties()).not.toHaveProperty("userId");
  });

  it("로그인했다 로그아웃하면 userId가 붙었다가 다시 빠진다", () => {
    setAnalyticsUser("u1");
    expect(getCommonProperties().userId).toBe("u1");
    setAnalyticsUser(null);
    expect(getCommonProperties()).not.toHaveProperty("userId");
  });

  // 핵심 설계: 브라우저 세션 ≠ 인증 세션. 로그인·로그아웃은 userId만 바꾸고 sessionId는 건드리지 않는다.
  it("로그인·로그아웃으로 userId가 바뀌어도 sessionId는 그대로다", () => {
    const anonymous = getCommonProperties().sessionId;

    setAnalyticsUser("u1"); // 로그인
    expect(getCommonProperties().sessionId).toBe(anonymous);

    setAnalyticsUser(null); // 로그아웃
    expect(getCommonProperties().sessionId).toBe(anonymous);
  });

  it("ts는 이벤트마다 발생 시점으로 다시 평가된다", () => {
    const first = getCommonProperties().ts as string;
    // 시간이 흐른 뒤 다시 부르면 더 늦은 시각이거나 같아야 한다(과거로 가지 않는다).
    const second = getCommonProperties().ts as string;
    expect(new Date(second).getTime()).toBeGreaterThanOrEqual(new Date(first).getTime());
  });
});

describe("device 판별", () => {
  function stubWidth(matchesQuery: (query: string) => boolean) {
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({ matches: matchesQuery(query) })),
    );
  }

  it("좁은 화면은 mobile", () => {
    stubWidth((query) => query.includes("767px"));
    expect(getCommonProperties().device).toBe("mobile");
  });

  it("중간 화면은 tablet", () => {
    stubWidth((query) => query.includes("1023px"));
    expect(getCommonProperties().device).toBe("tablet");
  });

  it("넓은 화면은 desktop", () => {
    stubWidth(() => false);
    expect(getCommonProperties().device).toBe("desktop");
  });
});
