import type { SessionState, SessionUser } from "./types";

export const ANONYMOUS: SessionState = { status: "anonymous" };
export const EXPIRED: SessionState = { status: "expired" };

// ── 세션 상태를 정하는 단 하나의 함수 ───────────────────────────────────────
//
// 이 파일이 생긴 이유: 만료를 판정하는 자리가 셋으로 흩어져 있었다.
//   ① 서버 레이아웃    — 쿠키는 있는데 서명·만료 검증에 실패했다
//   ② 세션 조회 queryFn — /api/auth/me가 401을 줬다
//   ③ QueryCache.onError — 보호된 리소스가 401을 줬다
//
// 셋이 각자 판단하니 서로를 덮었다. ①이 `expired`를 심어도 60초 뒤 ②가 다시
// 물어보고 401을 받아 `anonymous`로 접었다. 사용자가 보던 "세션이 만료되었습니다"가
// 소리 없이 "로그인하세요"로 바뀐다.
//
// 규칙을 하나로 적는다.
//
//   서버가 인정했다                        → authenticated
//   거절했는데, 이 브라우저가 로그인했다고 믿는다 → expired
//   거절했고, 믿을 근거도 없다               → anonymous
//
// "믿는다"의 근거는 두 가지다. 세션 쿠키를 들고 왔거나(서버만 볼 수 있다,
// httpOnly라서), 직전까지 authenticated였거나(클라이언트가 볼 수 있다).
// 그래서 판정에 **직전 상태**가 필요하고, 그게 이 함수의 인자다.

/** 서버가 세션을 인정하지 않았을 때, 직전 상태를 보고 다음 상태를 정한다. */
export function rejectSession(previous: SessionState | undefined): SessionState {
  if (previous === undefined || previous.status === "anonymous") {
    return ANONYMOUS;
  }
  // authenticated였으면 만료다. 이미 expired면 그대로 둔다 —
  // 다시 물어봤다고 해서 "로그인한 적 없음"이 되지는 않는다.
  return EXPIRED;
}

export function acceptSession(user: SessionUser): SessionState {
  return { status: "authenticated", user };
}

// 서버 전용 진입점. 근거가 다르다 — 서버는 쿠키를 직접 볼 수 있고, 클라이언트는
// httpOnly라 못 본다. 그래서 서버가 대신 판정해 초기 상태로 심어 준다.
// 규칙 자체는 위와 같다.
export function sessionFromCookie(hasCookie: boolean, user: SessionUser | null): SessionState {
  if (user !== null) {
    return acceptSession(user);
  }
  return hasCookie ? EXPIRED : ANONYMOUS;
}
