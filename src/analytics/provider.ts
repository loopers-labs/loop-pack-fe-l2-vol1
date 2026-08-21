export type EventProperties = Record<string, unknown>;

/**
 * 분석 도구 하나를 감싸는 인터페이스.
 *
 * 화면 코드는 이 인터페이스를 모른다. `tracker.ts`의 `track()`만 부르고,
 * 어디로 보낼지는 앱 시작 지점에서 프로바이더를 등록해 결정한다.
 * 도구를 바꾸거나 늘릴 때 화면을 열지 않아도 되는 이유다.
 */
export interface AnalyticsProvider {
  readonly name: string;

  /** SDK 로드와 초기화. 실패해도 앱을 멈추지 않게 tracker가 감싼다 */
  initialize(): Promise<void> | void;

  track(event: string, properties: EventProperties): void;

  /** 로그인 시점에 사용자를 식별한다 */
  identify(userId: string, properties?: EventProperties): void;

  /** 로그아웃 시점에 식별을 끊는다 */
  reset(): void;
}

/*
 * 실제 도구를 붙이는 자리
 * ─────────────────────────────────────────────────────────────
 * 아래는 형태만 보여주는 예시다. 이번 과제에서는 붙이지 않아도 된다.
 * 붙이려면 각 SDK를 설치하고 키를 환경 변수로 넣는다.
 *
 * GA4 (gtag.js)
 *   const ga4Provider: AnalyticsProvider = {
 *     name: "ga4",
 *     initialize() {
 *       // <script src="https://www.googletagmanager.com/gtag/js?id=..."> 를 주입하고
 *       // window.dataLayer 와 gtag 함수를 준비한다
 *     },
 *     track(event, properties) {
 *       window.gtag?.("event", event, properties);
 *     },
 *     identify(userId) {
 *       window.gtag?.("set", { user_id: userId });
 *     },
 *     reset() {
 *       window.gtag?.("set", { user_id: null });
 *     },
 *   };
 *
 * GTM (dataLayer 직접 push)
 *   track(event, properties) {
 *     window.dataLayer?.push({ event, ...properties });
 *   }
 *   GTM은 태그·트리거를 콘솔에서 관리한다. 코드는 dataLayer에 넣는 일만 한다.
 *
 * Amplitude
 *   import * as amplitude from "@amplitude/analytics-browser";
 *   initialize() { amplitude.init(process.env.NEXT_PUBLIC_AMPLITUDE_KEY!); }
 *   track(event, properties) { amplitude.track(event, properties); }
 *   identify(userId) { amplitude.setUserId(userId); }
 *   reset() { amplitude.reset(); }
 *
 * 도구를 두 개 이상 붙이면 이벤트 이름 규칙이 도구마다 다른 문제를 만난다.
 * GA4는 snake_case를 권하고 Amplitude는 제약이 없다. 규칙을 한쪽으로 정하고
 * 프로바이더에서 변환하는 편이 화면 코드를 지키는 방법이다.
 */
