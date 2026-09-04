import type { EventProperties } from '@/analytics/provider';

// 모든 이벤트에 붙는 값 — 시드 로그의 최상위 필드와 같은 이름(sessionId · device · ts).
// `setCommonProperties()`에 넘기는 함수라 이벤트 발생 시점마다 평가된다.

const SESSION_KEY = 'analytics.sessionId';

// 세션 = 탭. sessionStorage는 탭을 닫으면 사라져 시드의 "같은 세션 = 같은 값" 정의와 맞고,
// 이 앱의 메모리 카트 수명과도 같다.
function readSessionId(): string {
  try {
    const stored = window.sessionStorage.getItem(SESSION_KEY);
    if (stored) return stored;
    const created = `s_${Math.random().toString(36).slice(2, 10)}`;
    window.sessionStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    // 저장소가 막힌 환경(프라이빗 모드 등)에서는 탭 생명주기 동안 메모리 값으로 대신한다.
    return fallbackSessionId;
  }
}
const fallbackSessionId = `s_${Math.random().toString(36).slice(2, 10)}`;

// UA 파싱 대신 뷰포트 폭 — 단순하고 결정적이다. 시드의 세 값과 같다.
function readDevice(): 'mobile' | 'tablet' | 'desktop' {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

export function commonProperties(): EventProperties {
  return {
    sessionId: readSessionId(),
    device: readDevice(),
    ts: new Date().toISOString(),
  };
}
