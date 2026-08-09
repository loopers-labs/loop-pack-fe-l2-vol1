import type { Metadata } from 'next'

// 페이지가 자기 이미지를 정하지 못했을 때 공유 카드에 남는 그림이다. 새로 만들지 않는다.
export const FALLBACK_OG_IMAGE = '/images/products/p6.jpg'

// 여러 App Router metadata 파일이 공유하는 전역 정책이다.
// 페이지는 이 객체를 펼쳐 쓴 뒤 자기 title과 description만 얹는다.
// 페이지가 openGraph를 정의하면 shallow merge라 루트 값이 통째로 사라지기 때문이다.
// locale은 문서의 lang 계약을 따른다. 루트가 <html lang="ko">이고 배너와 API 문구가 한국어다.
export const sharedOpenGraph = {
  siteName: 'Loop Market',
  locale: 'ko_KR',
  type: 'website',
  images: [FALLBACK_OG_IMAGE],
} satisfies NonNullable<Metadata['openGraph']>
