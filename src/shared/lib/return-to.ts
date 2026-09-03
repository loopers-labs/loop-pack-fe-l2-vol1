export const LOGIN_PATH = "/login";
export const RETURN_TO_PARAM = "next";
export const LOGIN_REASON_PARAM = "reason";
export const DEFAULT_RETURN_TO = "/";
const API_PREFIX = "/api";

export type LoginReason = "expired";

// 공백·제어 문자가 섞인 값은 헤더 주입이나 URL 파싱 차이를 만들 수 있어 통째로 버린다
const hasUnsafeCharacters = (value: string) =>
  /\s/.test(value) ||
  Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code < 0x20 || code === 0x7f;
  });

// 같은 사이트 안의 경로만 허용한다. 스킴·호스트가 섞이면 외부로 튕길 수 있으므로 전부 기본값으로 떨어뜨린다.
// - "/" 로 시작해야 한다 ("//evil.com", "/\\evil.com" 은 브라우저가 호스트로 해석한다)
// - 로그인 페이지 자기 자신은 복원 대상이 아니다 (로그인 → 로그인 루프)
export function sanitizeReturnTo(value: string | null | undefined): string {
  if (typeof value !== "string" || value === "") {
    return DEFAULT_RETURN_TO;
  }

  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return DEFAULT_RETURN_TO;
  }

  if (hasUnsafeCharacters(value)) {
    return DEFAULT_RETURN_TO;
  }

  const pathname = value.split(/[?#]/, 1)[0];
  if (pathname === LOGIN_PATH || pathname.startsWith(`${LOGIN_PATH}/`)) {
    return DEFAULT_RETURN_TO;
  }

  // API 라우트는 화면이 아니다. 로그인 뒤 JSON 응답으로 떨어지는 대신 홈으로 보낸다
  if (pathname === API_PREFIX || pathname.startsWith(`${API_PREFIX}/`)) {
    return DEFAULT_RETURN_TO;
  }

  return value;
}

export function buildLoginUrl(returnTo: string, reason?: LoginReason): string {
  const params = new URLSearchParams();
  const safeReturnTo = sanitizeReturnTo(returnTo);
  if (safeReturnTo !== DEFAULT_RETURN_TO) {
    params.set(RETURN_TO_PARAM, safeReturnTo);
  }
  if (reason !== undefined) {
    params.set(LOGIN_REASON_PARAM, reason);
  }

  const query = params.toString();
  return query === "" ? LOGIN_PATH : `${LOGIN_PATH}?${query}`;
}

export const isLoginReason = (value: string | null | undefined): value is LoginReason =>
  value === "expired";
