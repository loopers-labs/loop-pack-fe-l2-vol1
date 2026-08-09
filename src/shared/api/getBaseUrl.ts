// 서버(RSC·prefetch·generateMetadata)용 절대 origin.
// env 없이도 바로 과제 확인 가능하게 로컬 기본값을 둔다.
export const SITE_URL = process.env.APP_ORIGIN ?? "http://localhost:3000";

// 클라이언트: 상대경로("") — 브라우저가 현재 origin 으로 해석한다.
// 서버: 상대 URL 은 fetch 가 안 되므로 절대 URL(SITE_URL)이 필요하다.
export function getBaseUrl(): string {
  if (typeof window !== "undefined") return "";

  return SITE_URL;
}
