// ── 모든 이벤트에 붙는 공통 프로퍼티 ────────────────────────────────────────
// 무엇을 넣을지는 스타터가 정하지 않는다. 시드 로그가 `sessionId`·`ts`·`device`를
// 최상위에 갖고 있어 같은 셋으로 맞췄다 — 집계 스크립트를 새로 쓰지 않기 위해서다.
//
// `userId`는 여기 넣지 않는다. `identify()`가 소유하고, 시드 로그에서도 로그인
// 이후 이벤트에만 붙는다. 공통에 넣으면 로그아웃 뒤에도 남을 위험이 있다.

const SESSION_STORAGE_KEY = "analytics_session_id";

// 세션 식별자는 **탭 하나**의 수명을 따른다. sessionStorage를 쓴 이유가 둘이다.
//   1) localStorage면 브라우저를 닫았다 열어도 같은 세션이 되어, 3단계의
//      "세션 기준 집계"가 사람 기준 집계로 변한다.
//   2) 메모리에만 두면 새로고침마다 세션이 갈려 이탈률이 부풀려진다.
// 탭 복제로 같은 id가 두 탭에 생기는 건 감수한다 — 집계 단위가 조금 넓어질 뿐,
// 결제처럼 중복이 사고가 되는 자리에 쓰지 않는다.
function readSessionId(): string {
  if (typeof window === "undefined") {
    return "s_server";
  }
  try {
    const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing !== null) {
      return existing;
    }
    // 시드 로그와 같은 모양(`s_` + 4자리)으로 만든다.
    const created = `s_${Math.random().toString(16).slice(2, 6)}`;
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, created);
    return created;
  } catch {
    // 프라이빗 모드·차단 설정에서 접근 자체가 던진다. 계측이 화면을 죽이면 안 된다.
    return "s_unknown";
  }
}

// 시드 로그의 device는 mobile·desktop·tablet이고 null인 줄도 있다.
// null을 그대로 흉내 내지 않는다 — 우리가 만드는 로그에서 null은 "못 읽었다"는
// 사실이어야 의미가 있다(3단계에서 이걸 봇 판정에 쓴다).
function readDevice(): "mobile" | "tablet" | "desktop" | null {
  if (typeof window === "undefined") {
    return null;
  }
  const width = window.innerWidth;
  if (width === 0) {
    return null;
  }
  if (width < 640) {
    return "mobile";
  }
  if (width < 1024) {
    return "tablet";
  }
  return "desktop";
}

// 발생 시점에 평가된다 — setCommonProperties에 함수를 넘기는 이유다.
// 값으로 넘기면 초기화 시점의 device·ts가 모든 이벤트에 박힌다.
export function commonProperties() {
  return {
    sessionId: readSessionId(),
    ts: new Date().toISOString(),
    device: readDevice(),
  };
}
