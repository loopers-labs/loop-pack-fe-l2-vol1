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
//
// 한 번의 검증으로는 안 된다 — `/.//evil.com` 같은 입력은 new URL()이 '.'
// 세그먼트를 정규화하면서 origin은 그대로(http://localhost) 두지만 pathname을
// '//evil.com'으로 만든다. 이 pathname을 그대로 반환해서 나중에 redirect()나
// location.href에 쓰면, 그건 다시 프로토콜-상대 URL로 해석돼 실제로 외부 사이트로
// 나간다(10주차 코드 리뷰에서 발견, node로 직접 재현 확인함). 그래서 만들어낸
// 결과물을 같은 방식으로 한 번 더 검증해서, 그 결과물 자체가 다른 곳으로 새는
// 문자열이 아닌지 확인한다.
export function getSafeRedirectPath(raw: string | null): string {
  if (!raw) return FALLBACK_PATH;

  let resolved: URL;
  try {
    resolved = new URL(raw, SENTINEL_ORIGIN);
  } catch {
    return FALLBACK_PATH;
  }

  if (resolved.origin !== SENTINEL_ORIGIN) return FALLBACK_PATH;

  const candidate = resolved.pathname + resolved.search + resolved.hash;

  // candidate 자체를 다시 같은 sentinel 기준으로 파싱해, 이게 또 다른 곳으로
  // 새는 문자열이 아닌지 재검증한다(예: '//evil.com'은 origin 비교는
  // 통과했지만, 이 자체가 다시 파싱되면 프로토콜-상대 URL로 풀린다).
  let reparsed: URL;
  try {
    reparsed = new URL(candidate, SENTINEL_ORIGIN);
  } catch {
    return FALLBACK_PATH;
  }
  if (reparsed.origin !== SENTINEL_ORIGIN) return FALLBACK_PATH;

  return candidate;
}
