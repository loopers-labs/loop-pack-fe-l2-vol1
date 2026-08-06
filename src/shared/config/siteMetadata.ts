import type { Metadata } from 'next';

export const SITE_NAME = 'Commerce';
export const SITE_DESCRIPTION = '인기 상품과 새로 들어온 상품을 카테고리별로 살펴보는 커머스입니다.';

/** Open Graph 이미지를 찾지 못했을 때 쓰는 기본 이미지. */
export const OG_FALLBACK_IMAGE = '/images/week-07/hero-landscape-1280.jpg';

/**
 * 페이지 metadata 가 재사용하는 공통 Open Graph 필드.
 *
 * 페이지에서 `openGraph` 를 지정하면 루트의 `openGraph` 전체를 **덮어쓴다**(shallow merge).
 * 그래서 페이지마다 이 값을 펼쳐 넣어 siteName·locale·type 이 사라지지 않게 한다.
 */
export const COMMON_OPEN_GRAPH = {
  siteName: SITE_NAME,
  locale: 'ko_KR',
  type: 'website',
} as const satisfies NonNullable<Metadata['openGraph']>;

/**
 * 이미지 하나를 Open Graph images 항목으로 만든다.
 * 상대 경로는 metadataBase 를 기준으로 Next 가 절대 URL 로 바꾼다.
 */
export const toOpenGraphImages = (url: string | undefined, alt: string) => [
  { url: url && url.length > 0 ? url : OG_FALLBACK_IMAGE, alt },
];
