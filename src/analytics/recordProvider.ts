import type { AnalyticsProvider } from './provider';

// 05-step2-design.md 3절 — 2-a(시드 모양 기록) 실현. 등록하는 provider는 이것 하나다.
// consoleProvider는 등록하지 않는다(같은 데이터가 두 모양으로 중복 저장되는 것을 피한다).
const RECORDS_KEY = 'analytics.records';

function readRecords(): unknown[] {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(RECORDS_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const recordProvider: AnalyticsProvider = {
  name: 'record',
  // 기존 레코드를 지우지 않는다 — 전체 페이지 이동 뒤에도 같은 탭이면 같은 세션이다(2-b).
  // 메모리 배열이 아니라 sessionStorage를 쓰는 이유도 같다: 세션(탭 생존)보다 짧은
  // 페이지 수명에 로그가 갇히면 가드 리다이렉트·만료 리다이렉트마다 레코드가 사라진다.
  initialize() {},
  track(event, properties) {
    if (typeof window === 'undefined') return;

    const { sessionId, ts, device, userId, ...props } = properties;
    const record = {
      sessionId,
      ts,
      name: event,
      props,
      device,
      ...(userId !== undefined && { userId })
    };

    sessionStorage.setItem(RECORDS_KEY, JSON.stringify([...readRecords(), record]));
    console.info(`[analytics] ${event}`, record);
  },
  identify() {},
  reset() {}
};
