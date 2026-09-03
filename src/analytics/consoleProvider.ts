import type { AnalyticsProvider, EventProperties } from "./provider";

declare global {
  interface Window {
    /** 브라우저에서 확인하기 위한 이벤트 버퍼 */
    __analytics?: Array<{ event: string; properties: EventProperties }>;
  }
}

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
    console.info(`[analytics] ${event}`, properties);
  },

  identify(userId, properties) {
    console.info(`[analytics] identify ${userId}`, properties ?? {});
  },

  reset() {
    console.info("[analytics] reset");
  },
};
