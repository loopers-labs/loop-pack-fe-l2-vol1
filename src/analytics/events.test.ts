import { beforeEach, describe, expect, it } from 'vitest'
import {
  identifyUser,
  resetUser,
  trackCartAdd,
  trackCategoryFilterChange,
  trackLoginFail,
  trackLoginStart,
  trackLoginSuccess,
  trackOrderComplete,
  trackOrderStart,
  trackPageChange,
  trackProductListView,
  trackSortChange,
  trackWishlistAdd,
} from './events'
import { commonProperties } from './context'
import {
  initAnalytics,
  registerProviders,
  resetAnalyticsForTest,
  setCommonProperties,
} from './logger'
import type { AnalyticsProvider, EventProperties } from './provider'

// 이벤트 이름과 프로퍼티가 실제로 프로바이더까지 그 모양으로 가는지 고정한다.
//
// 이 테스트가 없으면 events.ts 의 이름 문자열을 전부 바꿔도, identify·reset 배선을
// 지워도 전체 테스트가 초록이다. 화면 테스트는 @/analytics/events 를 통째로 mock 하고,
// logger 테스트는 자기가 넣은 문자열을 되받아서 둘 다 이름을 보지 않기 때문이다.

const sent: { event: string; properties: EventProperties }[] = []
let identified: string[] = []
let resetCount = 0

const recorder: AnalyticsProvider = {
  name: 'recorder',
  initialize() {},
  track(event, properties) {
    sent.push({ event, properties })
  },
  identify(userId) {
    identified.push(userId)
  },
  reset() {
    resetCount += 1
  },
}

const lastEvent = () => sent[sent.length - 1]

beforeEach(async () => {
  resetAnalyticsForTest()
  registerProviders([recorder])
  // 실제 commonProperties 를 쓴다. identifyUser 가 userId 를 붙이는 경로가
  // context.ts 를 지나므로, 가짜로 바꾸면 그 배선이 테스트를 빠져나간다.
  setCommonProperties(commonProperties)
  await initAnalytics()

  // 앞 테스트가 남긴 사용자 식별을 지운다. 초기화가 끝난 뒤에 지워야 그 reset 이
  // 큐를 타고 recorder 에 들어가지 않는다.
  resetUser()
  sent.length = 0
  identified = []
  resetCount = 0
})

describe('이벤트 이름과 프로퍼티', () => {
  it('목록 진입과 조건 변경', () => {
    trackProductListView({ category: 'all', sort: 'latest', page: 1 })
    expect(lastEvent()).toMatchObject({
      event: 'product_list_view',
      properties: { category: 'all', sort: 'latest', page: 1 },
    })

    trackCategoryFilterChange({ category: 'living' })
    expect(lastEvent().event).toBe('category_filter_change')

    trackSortChange({ sort: 'price' })
    expect(lastEvent().event).toBe('sort_change')

    trackPageChange({ page: 2 })
    expect(lastEvent().event).toBe('page_change')
  })

  it('담기는 수량 1을 붙여 보낸다', () => {
    // 우리 담기는 수량이 없는 토글이라 시드 스키마의 quantity 를 1로 고정한다.
    trackCartAdd({ productId: 'p1' })
    expect(lastEvent()).toMatchObject({
      event: 'cart_add',
      properties: { productId: 'p1', quantity: 1 },
    })
  })

  it('찜', () => {
    trackWishlistAdd({ productId: 'p2' })
    expect(lastEvent()).toMatchObject({
      event: 'wishlist_add',
      properties: { productId: 'p2' },
    })
  })

  it('로그인 세 가지', () => {
    trackLoginStart({ from: '/orders' })
    expect(lastEvent()).toMatchObject({
      event: 'login_start',
      properties: { from: '/orders' },
    })

    trackLoginSuccess({ from: '/orders' })
    expect(lastEvent().event).toBe('login_success')

    // reason 은 status 숫자가 아니라 의미다.
    trackLoginFail({ reason: 'invalid_credentials' })
    expect(lastEvent()).toMatchObject({
      event: 'login_fail',
      properties: { reason: 'invalid_credentials' },
    })
  })

  it('주문 두 가지', () => {
    trackOrderStart({ productIds: ['p1', 'p2'], itemCount: 2 })
    expect(lastEvent()).toMatchObject({
      event: 'order_start',
      properties: { productIds: ['p1', 'p2'], itemCount: 2 },
    })

    trackOrderComplete({ orderId: 'o1', itemCount: 2 })
    expect(lastEvent()).toMatchObject({
      event: 'order_complete',
      properties: { orderId: 'o1', itemCount: 2 },
    })
  })

  it('모든 이벤트에 공통 프로퍼티가 붙는다', () => {
    trackCartAdd({ productId: 'p1' })
    // node 환경이라 sessionId 는 'server', device 는 null 이다. 값 자체가 아니라
    // 키가 붙는지를 본다.
    expect(Object.keys(lastEvent().properties)).toEqual(
      expect.arrayContaining(['sessionId', 'ts', 'device']),
    )
  })
})

describe('사용자 식별', () => {
  it('식별하면 이후 이벤트에 userId 가 붙는다', () => {
    identifyUser('u1')
    expect(identified).toEqual(['u1'])

    trackCartAdd({ productId: 'p1' })
    expect(lastEvent().properties).toMatchObject({ userId: 'u1' })
  })

  it('초기화하면 이후 이벤트에서 userId 가 사라진다', () => {
    // reset 배선이 빠지면 로그아웃 뒤 이벤트가 앞 사용자 id 로 남는다.
    identifyUser('u1')
    resetUser()
    expect(resetCount).toBe(1)

    trackCartAdd({ productId: 'p1' })
    expect(lastEvent().properties).not.toHaveProperty('userId')
  })
})
