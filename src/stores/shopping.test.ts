import { beforeEach, describe, expect, it } from 'vitest'
import { useShoppingStore } from './shopping'

// store 계약만 검증한다. 담기와 빼기, 목록의 독립성, 개수가 length에서 나오는지.

const getState = () => useShoppingStore.getState()

beforeEach(() => {
  useShoppingStore.setState({ cartIds: [], wishlistIds: [] })
})

describe('useShoppingStore', () => {
  it('같은 상품을 두 번 토글하면 원래대로 돌아온다', () => {
    getState().toggleCart('p1')
    expect(getState().cartIds).toEqual(['p1'])

    getState().toggleCart('p1')
    expect(getState().cartIds).toEqual([])
  })

  it('장바구니와 위시리스트는 서로 영향을 주지 않는다', () => {
    getState().toggleCart('p1')
    getState().toggleWishlist('p2')

    expect(getState().cartIds).toEqual(['p1'])
    expect(getState().wishlistIds).toEqual(['p2'])
  })

  it('다른 상품을 빼도 남은 상품은 유지된다', () => {
    getState().toggleCart('p1')
    getState().toggleCart('p2')
    getState().toggleCart('p1')

    expect(getState().cartIds).toEqual(['p2'])
  })

  it('개수는 ID 목록 length에서 파생된다. 별도 카운트 필드가 없다', () => {
    getState().toggleCart('p1')
    getState().toggleCart('p2')

    const state = getState()
    expect(state.cartIds.length).toBe(2)
    expect(Object.keys(state)).toEqual([
      'cartIds',
      'wishlistIds',
      'toggleCart',
      'toggleWishlist',
    ])
  })
})
