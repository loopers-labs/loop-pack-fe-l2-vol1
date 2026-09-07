import type { AnalyticsProvider, EventProperties } from "./provider";

declare global {
  interface Window {
    /** 브라우저에서 확인하기 위한 이벤트 봉투 버퍼 ({ name, ...공통, props }) */
    __analytics?: Array<{ name: string } & EventProperties>;
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
    // 봉투 한 줄: 이벤트명을 name 으로 찍고, 공통 프로퍼티·props 를 펼친다.
    // ({ ...공통, props } 는 logger 가 넘겨준 properties 에 이미 들어있다)
    const record = { name: event, ...properties };

    if (typeof window !== "undefined") {
      window.__analytics = [...(window.__analytics ?? []), record];
    }
    console.info(`[analytics] ${event}`, record);
  },

  identify(userId, properties) {
    console.info(`[analytics] identify ${userId}`, properties ?? {});
  },

  reset() {
    console.info("[analytics] reset");
  },
};
