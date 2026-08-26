// 로그인 후 복원 경로를 이 파라미터로 실어 나른다.
export const REDIRECT_PARAM = "redirectUrl";

const FALLBACK_PATH = "/";

// 오픈 리다이렉트 차단: same-origin 절대경로("/path")만 통과시키고 나머지는 홈으로 돌린다.
// 외부로 튕길 수 있는 스킴·프로토콜상대·백슬래시 트릭을 거른다.
export function safeRedirect(candidate: string | null | undefined): string {
  if (!candidate) return FALLBACK_PATH;

  if (!candidate.startsWith("/")) return FALLBACK_PATH;

  if (candidate.startsWith("//")) return FALLBACK_PATH; // 프로토콜 상대 URL → 외부 호스트

  if (candidate.startsWith("/\\")) return FALLBACK_PATH; // 브라우저가 \ 를 / 로 정규화 → 외부 호스트

  if (candidate.includes("://")) return FALLBACK_PATH; // 스킴 포함

  return candidate;
}
