const FALLBACK_PATH = '/';

// 로그인 성공 후 이동할 경로를 검증한다. 상대 경로만 허용하고,
// `//evil.com`, `https://evil.com` 같은 외부 주소로는 못 나가게 막는다.
export function getSafeRedirectPath(raw: string | null): string {
  if (!raw) return FALLBACK_PATH;
  if (!raw.startsWith('/')) return FALLBACK_PATH;
  if (raw.startsWith('//') || raw.includes('://')) return FALLBACK_PATH;
  return raw;
}
