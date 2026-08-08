// AI 생성: 루트 layout과 각 페이지의 generateMetadata가 함께 쓰는 공통 metadata 값.
// 페이지 openGraph는 루트와 shallow merge되어 루트 값을 통째로 덮으므로, 페이지는 commonOpenGraph를
// 펼친 위에 자기 필드를 얹는다.
import type { Metadata } from 'next';

export const SITE_NAME = 'Commerce';

export const SITE_DESCRIPTION = 'Loopers 커머스 - 4주차부터 여기에 쌓아갑니다.';

// 원본 hero-original.jpg는 7.2MB라 링크 미리보기 크롤러에 부적절해 1200w 산출물(210KB)을 쓴다.
export const OG_FALLBACK_IMAGE = '/images/week-07/optimized/hero-responsive-1200w.jpg';

export const commonOpenGraph = {
  siteName: SITE_NAME,
  locale: 'ko_KR',
  type: 'website'
} as const satisfies Metadata['openGraph'];
