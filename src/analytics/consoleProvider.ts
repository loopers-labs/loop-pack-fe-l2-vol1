import type { AnalyticsProvider, EventProperties } from "./provider";

declare global {
  interface Window {
    /** E2E와 수동 확인용 이벤트 버퍼. consoleProvider가 쌓는다 */
    __analytics?: Array<{ event: string; properties: EventProperties }>;
  }
}

/**
 * 개발 중 확인용 프로바이더.
 *
 * 콘솔에 찍고, 브라우저에서는 `window.__analytics`에도 쌓는다.
 * E2E에서 이 배열을 읽으면 "이 행동이 이 이벤트를 남기는가"를 검증할 수 있다.
 *
 *   const events = await page.evaluate(() => window.__analytics ?? []);
 *   expect(events.map((e) => e.event)).toContain("cart_add");
 *
 * 실제 도구를 붙인 뒤에도 이 프로바이더를 함께 등록해 두면
 * 무엇이 나가는지 눈으로 확인할 수 있다.
 */
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
