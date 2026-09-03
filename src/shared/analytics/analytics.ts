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

// 화면 코드는 이 파일만 부른다. 이름·프로퍼티가 스키마(events.ts)에 있는 것만 통과하므로
// `button_click` 같은 이름이 흘러들 수 없고, 나중에 집계할 수 없는 이벤트를 만들 수 없다
export function trackEvent<Name extends AnalyticsEventName>(
  name: Name,
  properties: AnalyticsEvents[Name],
): void {
  track(name, properties);
}

// 같은 사용자로 두 번 부르면 무시한다 — 세션 상태를 구독하는 곳이 여러 개여도 identify 는 한 번이다
export function identifyUser(userId: string): void {
  if (getCurrentUserId() === userId) {
    return;
  }
  setCurrentUserId(userId);
  identify(userId);
}

export function resetUser(): void {
  if (getCurrentUserId() === null) {
    return;
  }
  setCurrentUserId(null);
  reset();
}

// 앱 루트에서 한 번 부른다. 이 전에 쌓인 track() 은 logger 큐에 남아 있다가 순서대로 나간다
export async function setupAnalytics(
  providers: AnalyticsProvider[] = [consoleProvider],
): Promise<void> {
  registerProviders(providers);
  setCommonProperties(getCommonProperties);
  await initAnalytics();
}
