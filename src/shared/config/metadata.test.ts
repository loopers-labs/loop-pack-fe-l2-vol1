import { describe, expect, it } from 'vitest'
import { sharedOpenGraph } from './metadata'

// 페이지가 openGraph를 정의하면 루트 openGraph는 통째로 덮인다.
// 그래서 이 객체는 페이지가 펼쳐 쓰는 계약이고, 여기서 값이 빠지면
// 그 페이지의 문서에서 해당 태그가 사라진다.

describe('공통 Open Graph', () => {
  it('페이지가 펼쳐 써도 사이트 정체성이 남는다', () => {
    expect({ ...sharedOpenGraph, title: '상품' }).toMatchObject({
      siteName: 'Loop Market',
      locale: 'ko_KR',
      type: 'website',
    })
  })

  it('locale은 문서의 lang 계약을 따른다', () => {
    // 루트가 <html lang="ko">다. 여기만 en_US로 두면 두 계약이 어긋난다.
    expect(sharedOpenGraph.locale).toBe('ko_KR')
  })

  it('페이지별 title과 description을 공통 정책에 섞지 않는다', () => {
    // 공통 객체는 모든 페이지가 유지할 사이트 정체성만 소유한다.
    // title과 description은 각 페이지가 spread 이후 명시적으로 완성한다.
    expect(sharedOpenGraph).not.toHaveProperty('title')
    expect(sharedOpenGraph).not.toHaveProperty('description')
  })
})
