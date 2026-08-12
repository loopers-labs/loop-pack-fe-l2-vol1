import type { Metadata } from "next";

export const SITE_NAME = "Commerce";
export const SITE_DESCRIPTION = "Loopers 커머스 - 4주차부터 여기에 쌓아갑니다.";

// title.template은 정의한 세그먼트 자신(app/page.tsx)에는 적용되지 않으므로,
// root template과 홈이 같은 형식을 쓰도록 접미사를 한 곳에서 만든다
export const withSiteName = (title: string) => `${title} | ${SITE_NAME}`;

// OG 권장 크기에 맞춘 최적화 응답을 fallback 이미지로 사용
export const OG_FALLBACK_IMAGE =
  "/_next/image?url=%2Fimages%2Fweek-07%2Fhero-original.jpg&w=1200&q=75";

// 페이지 openGraph는 루트 openGraph를 shallow merge로 통째로 덮으므로,
// 페이지마다 이 공통 객체를 spread 해 siteName·locale·type을 유지한다
export const sharedOpenGraph = {
  siteName: SITE_NAME,
  locale: "ko_KR",
  type: "website",
  images: [OG_FALLBACK_IMAGE],
} satisfies Metadata["openGraph"];
