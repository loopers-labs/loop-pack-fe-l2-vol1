import type { Metadata } from 'next'

// 여러 App Router metadata 파일이 공유하는 전역 metadata 정책이다.
//
// 페이지가 openGraph를 정의하면 루트 openGraph 전체를 덮는다. shallow merge라
// 여기 있는 값이 통째로 사라진다. 그래서 페이지는 이 객체를 펼쳐 쓴 뒤
// 자기 title과 description만 얹는다.
//
// locale은 문서의 lang 계약을 따른다. 루트가 <html lang="ko">이고 배너와 API 문구가
// 한국어라서, storefront 일부가 영어라는 이유로 여기만 en_US로 두면 계약이 어긋난다.
export const sharedOpenGraph = {
  siteName: 'Loop Market',
  locale: 'ko_KR',
  type: 'website',
} satisfies NonNullable<Metadata['openGraph']>
