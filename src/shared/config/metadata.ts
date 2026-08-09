import type { Metadata } from "next";

export const SITE_NAME = "Commerce";
export const SITE_DESCRIPTION = "Loopers 커머스 - 4주차부터 여기에 쌓아갑니다.";
export const OG_FALLBACK_IMAGE = "/images/week-07/product-fallback.jpg";

export const baseOpenGraph = {
  siteName: SITE_NAME,
  locale: "ko_KR",
  type: "website",
  images: [{ url: OG_FALLBACK_IMAGE }],
} satisfies NonNullable<Metadata["openGraph"]>;
