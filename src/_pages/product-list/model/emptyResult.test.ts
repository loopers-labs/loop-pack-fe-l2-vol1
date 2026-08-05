import { describe, expect, it } from 'vitest'
import { describeEmptyResult } from './emptyResult'
import {
  productListSearchParams,
  type ProductListFilters,
} from './searchParams'

// 0건 화면이 "무엇을 걸어서 0건인가"를 말하는지 고정한다.
// 조건이 빠지면 사용자는 무엇을 되돌려야 할지 모른 채 빈 화면만 본다.

const labels = {
  category: (value: string) =>
    ({
      all: 'All',
      casual: 'Casual',
      goods: 'Beauty & Goods',
    })[value] ?? value,
  sort: (value: string) =>
    ({ latest: 'Newest', popular: 'Popular' })[value] ?? value,
}

// 기본값의 원본은 parser다. 테스트가 기본값을 따로 적으면 구현과 갈린다.
const defaultFilters: ProductListFilters = {
  q: productListSearchParams.q.defaultValue,
  category: productListSearchParams.category.defaultValue,
  sort: productListSearchParams.sort.defaultValue,
  page: productListSearchParams.page.defaultValue,
}

const describe0 = (filters: Partial<ProductListFilters>) =>
  describeEmptyResult({ ...defaultFilters, ...filters }, labels)

describe('0건 조건 설명', () => {
  it('조건이 하나도 없으면 필터를 언급하지 않는다', () => {
    // 걸어둔 것이 없는데 filters를 되돌리라고 하면 거짓이 된다.
    expect(describe0({})).toBe('No products are available.')
  })

  it('검색어만 있으면 검색어를 그대로 보여준다', () => {
    expect(describe0({ q: '니트' })).toBe('No products match “니트”.')
  })

  it('카테고리와 정렬은 서버 id가 아니라 사람이 읽는 이름으로 보여준다', () => {
    expect(describe0({ category: 'goods' })).toBe(
      'No products found in Beauty & Goods.',
    )
    expect(describe0({ sort: 'popular' })).toBe(
      'No products found, sorted by Popular.',
    )
  })

  it('2페이지 이상이면 페이지 번호도 조건에 넣는다', () => {
    expect(describe0({ page: 2 })).toBe('No products found on page 2.')
    expect(describe0({ q: '니트', page: 2 })).toBe(
      'No products match “니트” on page 2.',
    )
  })

  it('삽입구 뒤에 오는 페이지 번호만 쉼표로 끊는다', () => {
    expect(describe0({ sort: 'popular', page: 2 })).toBe(
      'No products found, sorted by Popular, on page 2.',
    )
  })

  it('조건이 여러 개면 검색어, 카테고리, 정렬, 페이지 순으로 잇는다', () => {
    expect(
      describe0({ q: '니트', category: 'goods', sort: 'popular', page: 2 }),
    ).toBe(
      'No products match “니트” in Beauty & Goods, sorted by Popular, on page 2.',
    )
  })

  it('기본값인 조건은 문장에 넣지 않는다', () => {
    const sentence = describe0({ q: '니트' })
    expect(sentence).not.toContain('All')
    expect(sentence).not.toContain('Newest')
    expect(sentence).not.toContain('page')
  })
})
