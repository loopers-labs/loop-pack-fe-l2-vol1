import { HttpResponse, http } from 'msw'
import { keepPreviousData } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { server } from '@/test/msw/server'
import {
  fetchProducts,
  productListQueries,
  productListRequestUrl,
  productListScenarioValues,
  type ProductListCondition,
} from './productList'

// 조건 객체 하나가 key와 요청 양쪽의 근원이다. key만 다르거나 요청만 다르면
// 캐시가 화면과 어긋난다. 그래서 key 계층과 요청 URL을 같은 파일에서 검증한다.
// 실패 표현과 타임아웃은 전송 계층의 책임이라 shared/api/http.test.ts가 맡는다.
//
// URL 조립은 순수 함수라 네트워크 없이 확인한다. 그다음 실제로 나간 요청을 MSW로 받아
// 조립한 URL이 그대로 전송되는지까지 이어서 본다. 조립만 보면 요청 경로가 바뀌어도 통과한다.

const defaultCondition: ProductListCondition = {
  q: '',
  category: 'all',
  sort: 'latest',
  page: 1,
  pageSize: 12,
  scenario: null,
}

// 서버 실행은 자기 주소를 몰라 절대 URL을 만들어 요청한다. node 환경의 fetch도 같다.
const TEST_ORIGIN = 'http://app.test'

// 나간 요청을 그대로 받아 둔다. 응답 본문은 이 파일의 관심사가 아니라 최소로 둔다.
const recordRequestedUrls = () => {
  const requested: string[] = []
  server.use(
    http.get('*/api/products', ({ request }) => {
      requested.push(request.url)
      return HttpResponse.json({
        products: [],
        categories: [],
        totalCount: 0,
        page: 1,
        pageSize: 12,
      })
    }),
  )
  return requested
}

describe('productListRequestUrl', () => {
  it('기본 정렬을 포함한 모든 조건을 명시해 조립한다', () => {
    expect(productListRequestUrl(defaultCondition)).toBe(
      '/api/products?category=all&sort=latest&page=1&pageSize=12',
    )
  })

  it('빈 검색어는 조건이 아니므로 URL에서 뺀다', () => {
    expect(productListRequestUrl(defaultCondition)).not.toContain('q=')
    expect(productListRequestUrl({ ...defaultCondition, q: '니트' })).toContain(
      'q=%EB%8B%88%ED%8A%B8',
    )
  })

  it('origin을 받으면 절대 URL로, 받지 않으면 상대 경로로 만든다', () => {
    // 브라우저는 상대 경로를 쓴다. origin은 전송 위치일 뿐이라 조건에 넣지 않는다.
    expect(productListRequestUrl(defaultCondition, TEST_ORIGIN)).toBe(
      `${TEST_ORIGIN}/api/products?category=all&sort=latest&page=1&pageSize=12`,
    )
  })
})

describe('fetchProducts', () => {
  it('조립한 URL이 그대로 요청으로 나간다', async () => {
    const requested = recordRequestedUrls()

    await fetchProducts(
      {
        q: '니트',
        category: 'casual',
        sort: 'price-asc',
        page: 2,
        pageSize: 12,
        scenario: null,
      },
      { origin: TEST_ORIGIN },
    )

    expect(requested).toEqual([
      `${TEST_ORIGIN}/api/products?q=%EB%8B%88%ED%8A%B8&category=casual&sort=price-asc&page=2&pageSize=12`,
    ])
  })

  it('응답 본문을 조회 결과로 돌려준다', async () => {
    server.use(
      http.get('*/api/products', () =>
        HttpResponse.json({
          products: [],
          categories: [],
          totalCount: 7,
          page: 1,
          pageSize: 12,
        }),
      ),
    )

    const response = await fetchProducts(defaultCondition, {
      origin: TEST_ORIGIN,
    })

    expect(response.totalCount).toBe(7)
  })

  // 재현 조건은 응답 시점을 바꾸므로 실제 요청까지 내려가야 한다.
  // 여기서 끊기면 URL에 slow를 넣어도 평소 응답이 와서 Before를 녹화할 수 없다.
  it('재현 조건이 있으면 scenario를 요청에 붙이고, 없으면 뺀다', async () => {
    const requested = recordRequestedUrls()

    // 세 값 모두 실제 요청까지 내려가야 여섯 상태를 화면에서 재현할 수 있다.
    for (const scenario of productListScenarioValues) {
      await fetchProducts(
        { ...defaultCondition, scenario },
        { origin: TEST_ORIGIN },
      )
    }
    productListScenarioValues.forEach((scenario, index) => {
      expect(requested[index]).toContain(`scenario=${scenario}`)
    })

    await fetchProducts(defaultCondition, { origin: TEST_ORIGIN })
    expect(requested).toHaveLength(productListScenarioValues.length + 1)
    expect(requested.at(-1)).not.toContain('scenario')
  })
})

describe('productListQueries', () => {
  it('일반에서 구체로 내려가는 목록 key 계층을 만든다', () => {
    const condition: ProductListCondition = {
      q: '니트',
      category: 'casual',
      sort: 'latest',
      page: 2,
      pageSize: 12,
      scenario: null,
    }

    expect(productListQueries.all()).toEqual(['products'])
    expect(productListQueries.lists()).toEqual(['products', 'list'])
    expect(productListQueries.list(condition).queryKey).toEqual([
      'products',
      'list',
      condition,
    ])
  })

  it('조건이 다르면 key도 달라 다른 캐시를 쓴다', () => {
    const base: ProductListCondition = {
      q: '',
      category: 'all',
      sort: 'latest',
      page: 1,
      pageSize: 12,
      scenario: null,
    }

    const pageChanged = productListQueries.list({ ...base, page: 2 })
    expect(pageChanged.queryKey).not.toEqual(
      productListQueries.list(base).queryKey,
    )
  })

  it('조건이 바뀌는 동안 이전 결과를 자리에 남긴다', () => {
    const condition: ProductListCondition = {
      q: '',
      category: 'all',
      sort: 'latest',
      page: 1,
      pageSize: 12,
      scenario: null,
    }

    // 이 옵션이 빠지면 조건을 바꾸는 순간 화면에 데이터가 없어져 목록이 통째로 사라진다.
    expect(productListQueries.list(condition).placeholderData).toBe(
      keepPreviousData,
    )
  })

  // 같은 필터라도 응답 시점이 다르면 다른 결과다. key가 같으면 느린 응답이
  // 평소 캐시를 덮거나 그 반대가 되어 무엇을 측정한 것인지 알 수 없게 된다.
  it('재현 조건이 다르면 key도 달라 다른 캐시를 쓴다', () => {
    const base: ProductListCondition = {
      q: '',
      category: 'all',
      sort: 'latest',
      page: 1,
      pageSize: 12,
      scenario: null,
    }

    expect(
      productListQueries.list({ ...base, scenario: 'slow' }).queryKey,
    ).not.toEqual(productListQueries.list(base).queryKey)
  })
})
