import { describe, expect, it } from 'vitest'
import { loadProductListParams } from './loadProductListParams'

describe('상품 목록 URL 정규화', () => {
  it('기본 조건을 하나의 확정된 query로 만든다', () => {
    expect(loadProductListParams(new URLSearchParams())).toEqual({
      q: '',
      category: 'all',
      sort: 'latest',
      page: 1,
      pageSize: 12,
      scenario: null,
    })
  })

  it('유효한 조건과 측정 scenario를 보존한다', () => {
    expect(
      loadProductListParams(
        new URLSearchParams(
          'q=%20니트%20&category=fashion&sort=price-desc&page=2&scenario=slow',
        ),
      ),
    ).toEqual({
      q: '니트',
      category: 'fashion',
      sort: 'price-desc',
      page: 2,
      pageSize: 12,
      scenario: 'slow',
    })
  })

  it('잘못된 enum과 1보다 작은 페이지를 기본값으로 정규화한다', () => {
    expect(
      loadProductListParams(
        new URLSearchParams(
          'category=unknown&sort=unknown&page=0&scenario=nope',
        ),
      ),
    ).toEqual({
      q: '',
      category: 'all',
      sort: 'latest',
      page: 1,
      pageSize: 12,
      scenario: null,
    })
  })
})
