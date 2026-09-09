const FALLBACK_PATH = '/';
// new URL()에 넘길 고정 베이스. 실제 origin일 필요는 없다 — resolved.origin이
// 이 값과 같은지만 비교해서 "raw가 origin을 안 벗어났는지"를 판정한다.
const SENTINEL_ORIGIN = 'http://localhost';

// 로그인 성공 후 이동할 경로를 검증한다. 상대 경로만 허용하고 외부 주소로는
// 못 나가게 막는다.
//
// 문자열 검사(startsWith('//'), includes('://'))로는 안 된다 — `/\evil.com`
// 처럼 둘 다 안 걸리는 입력이 있는데, 브라우저의 URL 파서는 백슬래시를
// 슬래시처럼 취급해서 이걸 http://evil.com/으로 풀어버린다. 대신 new URL()로
// 실제 파서가 이 문자열을 어떻게 해석하는지 먼저 확인하고, 그 결과의
// origin이 그대로인지(=다른 곳으로 안 샜는지)를 비교한다.
export function getSafeRedirectPath(raw: string | null): string {
  if (!raw) return FALLBACK_PATH;

  let resolved: URL;
  try {
    resolved = new URL(raw, SENTINEL_ORIGIN);
  } catch {
    return FALLBACK_PATH;
  }

  if (resolved.origin !== SENTINEL_ORIGIN) return FALLBACK_PATH;
  return resolved.pathname + resolved.search + resolved.hash;
}
