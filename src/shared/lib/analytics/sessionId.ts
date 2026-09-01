const SESSION_ID_KEY = 'analytics-session-id';

/**
 * 이 방문을 식별하는 값.
 *
 * 탭 하나가 세션 하나다. sessionStorage 는 탭을 닫으면 사라지고 새 탭으로 복사되지 않아,
 * "한 번의 방문"이라는 정의가 저장소 동작으로 그대로 지켜진다. 유휴 시간을 재는 로직도,
 * 그 로직을 검증할 테스트도 필요 없다.
 *
 * 그 대신 한 사람이 탭을 두 개 열면 세션도 둘이 된다. 3단계에서 세션 기준으로 집계할 때
 * 이 정의를 한 문장으로 적어야 하는 이유다.
 */
export function getSessionId(): string {
  try {
    const stored = window.sessionStorage.getItem(SESSION_ID_KEY);

    if (stored !== null) {
      return stored;
    }

    const created = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_ID_KEY, created);

    return created;
  } catch {
    // 프라이빗 모드나 저장소 차단 환경에서는 세션을 이어붙일 수 없다.
    // 이벤트를 버리는 것보다 세션이 쪼개지는 편이 낫다고 보고 매번 새로 만든다.
    return crypto.randomUUID();
  }
}
