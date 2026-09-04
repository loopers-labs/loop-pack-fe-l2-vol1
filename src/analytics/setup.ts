import { consoleProvider } from "@/analytics/consoleProvider";
import { initAnalytics, registerProviders, setCommonProperties } from "@/analytics/logger";
import { getCommonProperties } from "@/analytics/session";

// 계측을 한 번 켜는 진입점. providers.tsx가 클라 최상단에서 마운트 시 1회 호출한다.
// 이 위치라 모든 화면 컴포넌트보다 먼저 초기화되어, 첫 track이 큐를 거치지 않고 바로 전송된다.
//
// 실제 분석 도구는 붙이지 않는다(명세). consoleProvider가 콘솔과 window.__analytics에 남긴다.
export function setupAnalytics(): void {
  registerProviders([consoleProvider]);
  // 모든 이벤트에 붙일 공통 프로퍼티(sessionId·device·ts·userId)를 등록한다.
  // getter라 track마다 발화 시점에 평가된다.
  setCommonProperties(getCommonProperties);
  void initAnalytics();
}
