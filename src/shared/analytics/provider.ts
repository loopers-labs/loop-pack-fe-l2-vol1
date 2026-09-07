export type EventProperties = Record<string, unknown>;

/**
 * 분석 도구 하나를 감싸는 인터페이스.
 *
 * 화면 코드는 이 인터페이스를 모른다. `logger.ts`의 `track()`만 부르고,
 * 어디로 보낼지는 프로바이더를 등록해 결정한다.
 */
export interface AnalyticsProvider {
  readonly name: string;

  /** SDK 로드와 초기화 */
  initialize(): Promise<void> | void;

  track(event: string, properties: EventProperties): void;

  identify(userId: string, properties?: EventProperties): void;

  reset(): void;
}

/*
 * 실제 도구를 붙이려면 이 인터페이스를 구현해 `registerProviders()`에 넘긴다.
 * 이번 과제에서는 붙이지 않아도 된다.
 *
 * GA4       gtag.js 를 로드하고 gtag("event", ...) 로 보낸다
 * GTM       window.dataLayer 에 push 한다. 태그와 트리거는 GTM 콘솔에서 관리한다
 * Amplitude @amplitude/analytics-browser 의 track / setUserId / reset 을 쓴다
 *
 * 각 SDK 문서를 보고 구현한다. 도구마다 이벤트 이름 규칙이 다르다는 점을 확인해 둔다.
 */
