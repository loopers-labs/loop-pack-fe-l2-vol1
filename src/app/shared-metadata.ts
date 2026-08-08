import type { Metadata } from 'next';

export const APP_ORIGIN = process.env.APP_ORIGIN ?? 'http://localhost:3000';

// 페이지 openGraph는 루트 openGraph를 shallow merge로 통째 덮는다.
// siteName·locale·type이 사라지지 않도록 페이지가 이 공통 객체를 명시적으로 스프레드한다.
export const sharedOpenGraph = {
  siteName: 'Commerce',
  locale: 'ko_KR',
  type: 'website',
} satisfies Metadata['openGraph'];

// Open Graph fallback 이미지 — 정상 empty 등 페이지 이미지가 없을 때도 유지한다.
// (metadataBase 기준 상대 경로로 절대화된다)
// hero 원본(7.5MB)이 아니라 배너 정적 이미지를 쓴다 — 크롤러가 받는 파일이므로 가벼워야 한다.
export const FALLBACK_OG_IMAGE = '/images/products/p6.jpg';
