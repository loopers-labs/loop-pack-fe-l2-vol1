// 서버(RSC·prefetch)용 절대 URL.
// 일반적으로 .env에서 가져올 걸로 예상되나, 과제라는 점을 감안하여 .env 없이도 바로 과제 확인 가능하게 아래와 같이 적용.
export const SITE_URL = "http://localhost:3000";

// 클라이언트: 상대경로("") — 브라우저가 현재 origin 으로 해석한다.
// 서버: 상대 URL 은 fetch 가 안 되므로 절대 URL(SITE_URL)이 필요하다.
export function getBaseUrl(): string {
  if (typeof window !== "undefined") return "";

  return SITE_URL;
}
