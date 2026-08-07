import { describe, expect, it } from 'vitest'
import {
  COMMON_OPEN_GRAPH,
  OPEN_GRAPH_FALLBACK_IMAGE,
  buildPageMetadata,
} from './siteMetadata'

describe('페이지 metadata 조립', () => {
  it('페이지 값과 공통 Open Graph 필드를 함께 유지한다', () => {
    const metadata = buildPageMetadata({
      title: '이번 주의 발견',
      description: '지금 가장 사랑받는 상품을 만나보세요.',
      image: '/images/products/p6.jpg',
    })

    expect(metadata.title).toBe('이번 주의 발견')
    expect(metadata.description).toBe('지금 가장 사랑받는 상품을 만나보세요.')
    expect(metadata.openGraph).toMatchObject({
      ...COMMON_OPEN_GRAPH,
      title: '이번 주의 발견',
      description: '지금 가장 사랑받는 상품을 만나보세요.',
      images: ['/images/products/p6.jpg'],
    })
  })

  it('페이지 이미지가 없으면 공통 fallback 이미지를 유지한다', () => {
    const metadata = buildPageMetadata({
      title: '상품 목록',
      description: '상품을 검색하고 둘러보세요.',
    })

    expect(metadata.openGraph).toMatchObject({
      images: [OPEN_GRAPH_FALLBACK_IMAGE],
    })
  })
})
