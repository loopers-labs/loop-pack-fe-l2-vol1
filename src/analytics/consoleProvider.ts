import type { AnalyticsProvider, EventProperties } from './provider';

// 콘솔 출력이 이 파일의 목적이다
/* eslint-disable no-console */

// 타입스크립트 기본 Window 인터페이스에 __analytics라는 새로운 속성을 추가하여
// 코드 내에서 window.__analytics라는 구문을 적을 수 있다.
declare global {
  interface Window {
    /** 브라우저에서 확인하기 위한 이벤트 버퍼 */
    __analytics?: Array<{ event: string; properties: EventProperties }>;
  }
}

/** 개발 중 확인용 프로바이더. 콘솔에 찍고 `window.__analytics`에 쌓는다. */
export const consoleProvider: AnalyticsProvider = {
  name: 'console',

  initialize() {
    if (typeof window !== 'undefined') {
      window.__analytics = [];
    }
  },

  track(event, properties) {
    if (typeof window !== 'undefined') {
      window.__analytics = [...(window.__analytics ?? []), { event, properties }];
    }
    console.info(`[analytics] ${event}`, properties);
  },

  identify(userId, properties) {
    console.info(`[analytics] identify ${userId}`, properties ?? {});
  },

  reset() {
    console.info('[analytics] reset');
  },
};
