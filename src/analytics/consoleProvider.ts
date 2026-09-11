import type { AnalyticsProvider, EventProperties } from "./provider";

declare global {
  interface Window {
    /** 브라우저에서 확인하기 위한 이벤트 버퍼 */
    __analytics?: Array<{ event: string; properties: EventProperties }>;
  }
}

// 스타터는 `console.info`로 찍었는데 이 레포의 `no-console`은 warn·error만 허용한다.
// 룰을 끄거나 이 폴더를 예외로 선언하지 않았다 — `src/analytics/`는 출하되는 코드이고,
// 적용 범위를 좁히는 선언(`src/examples/**`)은 라우트에서 도달하지 않는 견본에만 준 것이다.
// 그래서 채널만 warn으로 옮긴다. 검증에 쓰는 관찰 지점은 콘솔이 아니라 `window.__analytics`다.
const report = (message: string, properties: EventProperties) => {
  console.warn(`[analytics] ${message}`, properties);
};

/** 개발 중 확인용 프로바이더. 콘솔에 찍고 `window.__analytics`에 쌓는다. */
export const consoleProvider: AnalyticsProvider = {
  name: "console",

  initialize() {
    if (typeof window !== "undefined") {
      window.__analytics = [];
    }
  },

  track(event, properties) {
    if (typeof window !== "undefined") {
      window.__analytics = [...(window.__analytics ?? []), { event, properties }];
    }
    report(event, properties);
  },

  identify(userId, properties) {
    report(`identify ${userId}`, properties ?? {});
  },

  reset() {
    report("reset", {});
  },
};
