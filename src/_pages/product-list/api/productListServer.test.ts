import { describe, expect, it } from 'vitest'
import { loadProductListCondition } from '../model/serverSearchParams'
import { productListRequestUrl } from './productList'
import { serverProductListQuery } from './productListServer'

// 이 파일이 지키는 것은 화면이 아니라 서버 조회 횟수다.
// metadata와 본문 prefetch는 한 요청 안에서 readProductList의 캐시를 나눠 쓰고,
// 그 캐시 키가 productListRequestUrl이 만든 문자열이다. 두 경로가 만드는 문자열이
// 한 글자라도 갈리면 Route Handler가 두 번 돈다. 에러도 화면 변화도 없이 응답만 느려진다.
//
// React cache()는 요청 스코프 안에서만 동작해서 단위 테스트로 "1회 호출"을 직접
// 재현할 수 없다. 대신 그 dedup이 성립하기 위한 선행 조건을 여기서 고정한다.

const ORIGIN = 'http://127.0.0.1:3000'

describe('서버 조회 키가 결정적이다', () => {
  it('참조가 다른 조건 객체도 같은 URL을 만든다', async () => {
    const a = await loadProductListCondition(
      Promise.resolve({ category: 'digital', page: '2' }),
    )
    const b = await loadProductListCondition(
      Promise.resolve({ category: 'digital', page: '2' }),
    )

    expect(a.condition).not.toBe(b.condition)
    expect(productListRequestUrl(a.condition, ORIGIN)).toBe(
      productListRequestUrl(b.condition, ORIGIN),
    )
  })

  it('조건 객체의 키 순서가 달라도 같은 URL을 만든다', () => {
    const forward = {
      q: '니트',
      category: 'digital',
      sort: 'latest',
      page: 1,
      pageSize: 12,
      scenario: null,
    } as const
    const reversed = {
      scenario: null,
      pageSize: 12,
      page: 1,
      sort: 'latest',
      category: 'digital',
      q: '니트',
    } as const

    expect(productListRequestUrl(forward, ORIGIN)).toBe(
      productListRequestUrl(reversed, ORIGIN),
    )
  })

  it('URL 파라미터 순서를 고정한다', async () => {
    const { condition } = await loadProductListCondition(
      Promise.resolve({ q: '니트', category: 'digital', page: '2' }),
    )

    // 순서가 바뀌면 문자열이 갈려 캐시가 어긋난다. 손으로 유도한 리터럴로 고정한다.
    expect(productListRequestUrl(condition, ORIGIN)).toBe(
      `${ORIGIN}/api/products?q=%EB%8B%88%ED%8A%B8&category=digital&sort=latest&page=2&pageSize=12`,
    )
  })

  it('빈 검색어는 URL에서 아예 빠진다', async () => {
    const blank = await loadProductListCondition(Promise.resolve({ q: '' }))
    const absent = await loadProductListCondition(Promise.resolve({}))

    // 두 결과를 서로 비교하면 둘 다 같은 방식으로 깨졌을 때 통과한다.
    // 리터럴로 고정해야 q= 가 끼어드는 회귀를 잡는다.
    const expected = `${ORIGIN}/api/products?category=all&sort=latest&page=1&pageSize=12`
    expect(productListRequestUrl(blank.condition, ORIGIN)).toBe(expected)
    expect(productListRequestUrl(absent.condition, ORIGIN)).toBe(expected)
  })

  it('조건이 다르면 URL도 달라진다', async () => {
    const first = await loadProductListCondition(Promise.resolve({ page: '1' }))
    const second = await loadProductListCondition(
      Promise.resolve({ page: '2' }),
    )

    expect(productListRequestUrl(first.condition, ORIGIN)).not.toBe(
      productListRequestUrl(second.condition, ORIGIN),
    )
  })
})

describe('서버 query 계약', () => {
  it('queryFn이 signal을 받지 않는다', async () => {
    const { condition } = await loadProductListCondition(Promise.resolve({}))
    const query = serverProductListQuery(condition, ORIGIN)

    // signal이 options에 실리면 native fetch memoization이 빠지고,
    // 서버에는 화면을 떠나 취소할 사용자도 없다. 인자를 받지 않는 것이 계약이다.
    expect(query.queryFn.length).toBe(0)
  })

  it('같은 조건이면 브라우저와 같은 queryKey를 쓴다', async () => {
    const { condition } = await loadProductListCondition(
      Promise.resolve({ category: 'digital' }),
    )
    const server = serverProductListQuery(condition, ORIGIN)
    const other = serverProductListQuery(condition, 'http://localhost:9999')

    // origin은 key에 없다. 서버가 채운 캐시를 브라우저가 그대로 이어받아야 한다.
    expect(server.queryKey).toEqual(other.queryKey)
  })
})
