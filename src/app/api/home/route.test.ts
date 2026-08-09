import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GET } from './route'

const request = (query = '') =>
  GET(new NextRequest(`http://localhost/api/home${query}`))

describe('GET /api/home', () => {
  // slow 계약만 가짜 타이머와 NODE_ENV를 건드린다. 다른 케이스로 새지 않게 되돌린다.
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  it('returns banner, categories, popular products, and new products', async () => {
    const response = await request()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.banner).toEqual({
      title: '매일 새롭게 발견하는 취향',
      description: '지금 가장 사랑받는 상품을 만나보세요.',
      image: '/images/products/p6.jpg',
    })
    expect(body.categories).toEqual([
      { id: 'casual', name: '캐주얼' },
      { id: 'fashion', name: '패션' },
      { id: 'goods', name: '뷰티·잡화' },
      { id: 'home', name: '홈' },
      { id: 'digital', name: '디지털' },
    ])
    expect(
      body.popularProducts.map((product: { id: string }) => product.id),
    ).toEqual(['p21', 'p11', 'p15', 'p8', 'p22', 'p30'])
    expect(
      body.newProducts.map((product: { id: string }) => product.id),
    ).toEqual(['p26', 'p6', 'p27', 'p24', 'p1', 'p28'])
  })

  it('keeps banner and categories in the empty scenario', async () => {
    const response = await request('?scenario=empty')
    const body = await response.json()
    expect(body.banner).toBeDefined()
    expect(body.categories).toHaveLength(5)
    expect(body.popularProducts).toEqual([])
    expect(body.newProducts).toEqual([])
  })

  it('returns a deterministic error scenario', async () => {
    const response = await request('?scenario=error')
    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      message: '홈 데이터를 불러오지 못했습니다.',
    })
  })

  // 7주차 측정용 재현 조건이다. 이 테스트가 지연을 고정하므로,
  // 수치를 좋게 만들려고 지연을 줄이면 여기서 먼저 깨진다.
  it('slow 시나리오는 정상과 같은 응답을 1.5초 뒤에 돌려준다', async () => {
    vi.useFakeTimers()
    // 지연은 테스트 환경에서 0으로 눌린다. 실제 대기 계약을 보려면 production으로 둔다.
    vi.stubEnv('NODE_ENV', 'production')

    let settled = false
    const responsePromise = request('?scenario=slow').then((response) => {
      settled = true
      return response
    })

    await vi.advanceTimersByTimeAsync(1_499)
    expect(settled).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    const response = await responsePromise
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.banner.image).toBe('/images/products/p6.jpg')
    expect(body.popularProducts).toHaveLength(6)
    expect(body.newProducts).toHaveLength(6)
  })

  it('slow 시나리오의 응답 본문은 정상 응답과 같다', async () => {
    // 지연만 다르고 데이터가 갈리면 Before/After를 같은 화면으로 비교할 수 없다.
    const normal = await (await request()).json()
    const slow = await (await request('?scenario=slow')).json()

    expect(slow).toEqual(normal)
  })

  it('rejects an unknown scenario', async () => {
    const response = await request('?scenario=unknown')

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      message: '요청 조건을 확인해주세요.',
    })
  })
})
