import { describe, expect, it } from 'vitest'
import { cartCountOf, isInCartIds, toggleCartId } from './cart'

// 담기 규칙과 개수 파생만 검증한다. React도 DOM도 필요 없는 순수 규칙이라 여기서 잡는다.
// hook이 이 규칙을 실제로 구독하는지는 화면에서 확인한다(ProductListPage 통합 테스트).
// 이 파일은 wishlist를 import하지 않는다. 위시리스트를 지워도 그대로 통과해야 한다.

describe('toggleCartId', () => {
  it('담기지 않은 상품을 토글하면 목록 끝에 붙는다', () => {
    expect(toggleCartId(['p1'], 'p2')).toEqual(['p1', 'p2'])
  })

  it('이미 담긴 상품을 다시 토글하면 그 상품만 빠진다', () => {
    expect(toggleCartId(['p1', 'p2', 'p3'], 'p2')).toEqual(['p1', 'p3'])
  })

  it('같은 상품을 두 번 토글하면 원래 목록으로 돌아온다', () => {
    const once = toggleCartId(['p1'], 'p2')
    expect(toggleCartId(once, 'p2')).toEqual(['p1'])
  })

  it('원본 배열을 바꾸지 않고 새 배열을 만든다', () => {
    const before = ['p1']
    toggleCartId(before, 'p2')
    expect(before).toEqual(['p1'])
  })

  it('빈 목록에서 토글하면 그 상품 하나만 남는다', () => {
    expect(toggleCartId([], 'p1')).toEqual(['p1'])
  })
})

describe('cartCountOf', () => {
  it('담긴 ID 개수를 그대로 센다', () => {
    expect(cartCountOf(['p1', 'p2'])).toBe(2)
  })

  it('비어 있으면 0이다', () => {
    expect(cartCountOf([])).toBe(0)
  })

  it('토글로 뺀 뒤의 개수는 남은 ID 수와 같다', () => {
    expect(cartCountOf(toggleCartId(['p1', 'p2'], 'p1'))).toBe(1)
  })
})

describe('isInCartIds', () => {
  it('담긴 상품은 true, 담기지 않은 상품은 false다', () => {
    expect(isInCartIds(['p1'], 'p1')).toBe(true)
    expect(isInCartIds(['p1'], 'p2')).toBe(false)
  })

  it('빈 목록에서는 어떤 상품도 담겨 있지 않다', () => {
    expect(isInCartIds([], 'p1')).toBe(false)
  })
})
