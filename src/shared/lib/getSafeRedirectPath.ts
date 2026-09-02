// [AI] 복원 경로(redirectTo) 검증 — 화이트리스트 방식 (RFC "복원 값 검증 방식 결정").
// 허용 조건: '/'로 시작 && '//'로는 시작하지 않는다. 그 외는 조용히 기본 경로로 되돌린다.
// - 블랙리스트(https://만 거르기)는 http://, //evil.com, javascript: 등을 놓친다.
// - '//evil.com'은 스킴 생략형 프로토콜 상대 URL이라 '/'로 시작하지만 외부로 나간다.
// 검증 위치는 "값을 실어 보내는 곳"이 아니라 "값을 읽어 이동시키는 순간"(로그인 성공 핸들러)이다.
export const getSafeRedirectPath = (value: string | null | undefined, fallback = '/'): string => {
  if (!value) return fallback;
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;
  return value;
};
