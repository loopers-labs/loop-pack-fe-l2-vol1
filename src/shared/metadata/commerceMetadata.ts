import type { Metadata } from "next";

export const commerceSiteName = "Commerce";
export const commerceDescription = "Loopers 커머스에서 취향에 맞는 상품을 발견하세요.";
export const commerceOpenGraphFallbackImage = {
  url: "/images/week-07/hero-1600.webp",
  alt: "Commerce 추천 상품",
};

export const commerceOpenGraph = {
  siteName: commerceSiteName,
  locale: "ko_KR",
  type: "website",
} satisfies NonNullable<Metadata["openGraph"]>;

export function getAppOrigin() {
  return process.env.APP_ORIGIN ?? "http://localhost:3000";
}
