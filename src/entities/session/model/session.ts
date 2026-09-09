/**
 * 세션 도메인 타입.
 *
 * 스타터는 이 타입들을 `src/app/api/_data/auth.ts`에 두고 "본인 구조에 맞는 곳으로
 * 옮겨도 된다"고 안내한다. app 레이어에 두면 entities·features가 참조할 수 없어
 * (FSD 규칙상 상위 레이어만 하위를 참조한다) 화면 쪽이 응답 계약을 알 방법이 없다.
 * 타입만 여기로 내리고, `node:crypto`를 쓰는 서명·검증 함수는 app에 그대로 둔다.
 */

/** 로그인한 사용자. `/api/auth/me`와 `/api/auth/login`이 돌려주는 값이다 */
export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

/** 스타터가 제공하는 실패 재현 노브. query string이 우선이고 없으면 `scenario` 쿠키를 읽는다 */
export type AuthScenario = 'invalid' | 'expired' | 'error' | 'slow';

export type AuthErrorResponse = {
  message: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type SessionResponse = {
  user: AuthUser;
};

/**
 * 401의 의미.
 *
 * `/api/auth/me`는 "로그인 안 함"과 "세션 만료"를 같은 401로 돌려준다. 응답만으로는
 * 갈리지 않으므로 요청에 세션 쿠키가 실려 있었는지로 가른다. 쿠키가 없었다면 애초에
 * 로그인한 적이 없는 것이고, 있었는데 401이면 그 쿠키가 더는 유효하지 않은 것이다.
 */
export type SessionStatus = 'authenticated' | 'anonymous' | 'expired';

/**
 * 쿠키 유무와 세션 해석 결과로 상태를 정한다.
 *
 * @param hasSessionCookie 요청에 세션 쿠키가 실려 있었는지
 * @param user 세션을 해석해 얻은 사용자. 해석에 실패했으면 null
 */
export function resolveSessionStatus(
  hasSessionCookie: boolean,
  user: AuthUser | null,
): SessionStatus {
  if (user !== null) {
    return 'authenticated';
  }

  return hasSessionCookie ? 'expired' : 'anonymous';
}

/** 서버가 읽어 클라이언트로 내려보내는 세션 스냅샷 */
export type ServerSession = {
  status: SessionStatus;
  user: AuthUser | null;
};
