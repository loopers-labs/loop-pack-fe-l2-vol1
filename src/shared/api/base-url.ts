// 서버(generateMetadata·RSC prefetch)에서는 자신의 Route Handler를 절대 URL로 불러야 한다.
// APP_ORIGIN은 build와 runtime에 같은 값을 넣는다(7주차 실행 환경 계약).
// 클라이언트는 상대 경로 그대로 — 기존 동작 불변.
export function apiUrl(path: string): string {
  if (typeof window !== 'undefined') return path;
  const origin = process.env.APP_ORIGIN ?? 'http://localhost:3000';
  return `${origin}${path}`;
}
