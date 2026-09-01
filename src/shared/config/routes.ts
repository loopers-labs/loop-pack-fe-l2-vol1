/**
 * 보호 경로의 단일 정의.
 *
 * 두 곳이 이 값을 읽는다. proxy(미들웨어)는 세션 쿠키가 없는 요청을 여기서 걸러 로그인으로 보내고,
 * apiClient 의 401 인터셉터는 "지금 보고 있는 화면이 보호 경로인가"로 만료 여부를 가른다.
 * 목록이 두 벌이면 한쪽만 늘어났을 때 가드는 걸리는데 만료 안내는 안 뜨는 식으로 조용히 어긋난다.
 *
 * 판정 함수는 shared/lib/isProtectedPath 에 있다. 여기는 설정 값만 둔다.
 */
export const PROTECTED_ROUTES = ['/order', '/orders', '/mypage'] as const;

/** 로그인 화면. 미로그인·만료 모두 이 경로로 보내고 reason 으로 사유를 구분한다. */
export const LOGIN_PATH = '/login';

/** 복원 경로를 실어 나르는 쿼리 파라미터 이름. */
export const RETURN_TO_PARAM = 'returnTo';

/** 로그인 화면이 안내 문구를 가르는 신호. */
export const AUTH_REASON_PARAM = 'reason';

/**
 * 사유 값의 전체 목록. required = 미로그인, expired = 세션 만료.
 *
 * 타입을 손으로 적지 않고 이 배열에서 파생시킨다. 유니온을 따로 적으면 값을 늘릴 때
 * 목록과 타입이 갈리고, 값을 검사하는 쪽(로그인 화면)이 리터럴을 한 벌 더 적게 된다.
 */
export const AUTH_REASONS = ['required', 'expired'] as const;

export type AuthReason = (typeof AUTH_REASONS)[number];
