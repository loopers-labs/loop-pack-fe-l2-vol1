// 로그인 후 돌아갈 경로를 정한다 (RFC D4).
// `next`는 URL로 들어오는 값이라 신뢰하지 않는다 — "우리 앱 안의 경로처럼 보이는 것"만 통과시키고
// 나머지는 전부 기본 경로로 보낸다. 파싱(new URL)에 기대지 않고 문자열 규칙으로 막는 이유:
// `//evil.com`·`\\evil.com`·`javascript:` 류를 브라우저마다 다르게 해석하는 틈을 남기지 않기 위해서다.
export const DEFAULT_NEXT_PATH = '/';

// 백슬래시·스킴 구분자(:)·공백과 제어 문자(0x00~0x20, 0x7f)는 앱 경로에 있을 이유가 없다.
// 정규식에 제어 문자를 넣으면 no-control-regex에 걸리므로 문자 코드로 본다.
const isForbiddenCharacter = (ch: string) => {
  const code = ch.charCodeAt(0);
  return ch === '\\' || ch === ':' || code <= 0x20 || code === 0x7f;
};

export function resolveNextPath(
  raw: string | string[] | undefined,
  fallback: string = DEFAULT_NEXT_PATH,
): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === undefined || value === '') return fallback;

  // 반드시 '/'로 시작하고, 바로 뒤에 '/'가 오면 안 된다 (프로토콜 상대 URL `//host`).
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;
  if ([...value].some(isForbiddenCharacter)) return fallback;

  return value;
}
