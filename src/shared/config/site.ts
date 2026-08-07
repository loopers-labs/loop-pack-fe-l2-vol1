import type { Metadata } from 'next'

// 사이트 이름·로케일·OG fallback은 특정 도메인(상품·장바구니) 정책이 아니라 앱 전역 상수다.
// 루트 layout(app/)과 페이지 metadata(_pages)가 함께 쓰므로 두 레이어의 공통 하위인 shared에 둔다.
export const SITE_NAME = 'Commerce'

export const SITE_DESCRIPTION = 'Loopers 커머스 - 4주차부터 여기에 쌓아갑니다.'

// 첫 상품 이미지가 없는 화면(정상 empty 등)이 쓰는 Open Graph fallback.
// 상대경로로 두면 Next가 layout의 metadataBase를 기준으로 절대 URL로 바꿔준다.
export const OG_FALLBACK_IMAGE = '/images/week-07/hero-1200.webp'

// 페이지 metadata의 openGraph는 루트 openGraph와 shallow merge라,
// 페이지가 openGraph를 지정하는 순간 루트에만 있던 siteName·locale·type이 통째로 사라진다.
// 페이지에서 이 객체를 spread해 공통 필드를 명시적으로 재사용한다.
export const sharedOpenGraph = {
  siteName: SITE_NAME,
  locale: 'ko_KR',
  type: 'website',
} as const satisfies Metadata['openGraph']
