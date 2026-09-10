import { consoleProvider } from "@/analytics/consoleProvider";
import {
  identify,
  initAnalytics,
  registerProviders,
  reset,
  setCommonProperties,
  track,
} from "@/analytics/logger";
import type { AnalyticsProvider } from "@/analytics/provider";
import { getCommonProperties, getCurrentUserId, setCurrentUserId } from "./common-properties";
import type { AnalyticsEventName, AnalyticsEvents } from "./events";

let configured = false;

// 프로바이더와 공통 프로퍼티 등록은 동기다. 로거가 공통 프로퍼티를 track() 시점에 평가하므로,
// 첫 이벤트가 어느 컴포넌트에서 먼저 나가더라도 여기서 등록을 보장해야 sessionId·device·ts 가 빠지지 않는다.
// (마운트 순서에 의존하지 않는다 — AnalyticsInit 이 트리 어디에 있어도 같다)
function configure(providers: AnalyticsProvider[]) {
  registerProviders(providers);
  setCommonProperties(getCommonProperties);
  configured = true;
}

const ensureConfigured = () => {
  if (!configured) {
    configure([consoleProvider]);
  }
};

// 화면 코드는 이 파일만 부른다. 이름·프로퍼티가 스키마(events.ts)에 있는 것만 통과하므로
// `button_click` 같은 이름이 흘러들 수 없고, 나중에 집계할 수 없는 이벤트를 만들 수 없다
export function trackEvent<Name extends AnalyticsEventName>(
  name: Name,
  properties: AnalyticsEvents[Name],
): void {
  ensureConfigured();
  track(name, properties);
}

// 같은 사용자로 두 번 부르면 무시한다 — 세션 상태를 구독하는 곳이 여러 개여도 identify 는 한 번이다
export function identifyUser(userId: string): void {
  if (getCurrentUserId() === userId) {
    return;
  }
  ensureConfigured();
  setCurrentUserId(userId);
  identify(userId);
}

export function resetUser(): void {
  if (getCurrentUserId() === null) {
    return;
  }
  ensureConfigured();
  setCurrentUserId(null);
  reset();
}

// 앱 루트에서 한 번 부른다. 프로바이더 초기화(비동기)가 끝나기 전에 쌓인 이벤트는 로거 큐에 남아 있다가
// 순서대로 나간다 — 큐가 지키는 것은 "손실 없음" 이고, 공통 프로퍼티는 위의 동기 등록이 지킨다
export async function setupAnalytics(
  providers: AnalyticsProvider[] = [consoleProvider],
): Promise<void> {
  configure(providers);
  await initAnalytics();
}

export function resetSharedAnalyticsForTest(): void {
  configured = false;
  setCurrentUserId(null);
}
