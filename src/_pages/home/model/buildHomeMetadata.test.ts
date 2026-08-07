import { describe, expect, it } from 'vitest'
import { COMMON_OPEN_GRAPH } from '@/shared/config/siteMetadata'
import { buildHomeMetadata } from './buildHomeMetadata'

describe('홈 metadata', () => {
  it('홈 응답의 배너 정보와 공통 Open Graph 필드를 조합한다', () => {
    const metadata = buildHomeMetadata({
      banner: {
        title: '매일 새롭게 발견하는 취향',
        description: '지금 가장 사랑받는 상품을 만나보세요.',
        image: '/images/products/p6.jpg',
      },
      categories: [],
      popularProducts: [],
      newProducts: [],
    })

    expect(metadata.title).toBe('매일 새롭게 발견하는 취향')
    expect(metadata.description).toBe('지금 가장 사랑받는 상품을 만나보세요.')
    expect(metadata.openGraph).toMatchObject({
      ...COMMON_OPEN_GRAPH,
      title: '매일 새롭게 발견하는 취향',
      description: '지금 가장 사랑받는 상품을 만나보세요.',
      images: ['/images/products/p6.jpg'],
    })
  })
})
