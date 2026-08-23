import { describe, expect, it } from 'vitest'
import { isInWishlistIds, toggleWishlistId, wishlistCountOf } from './wishlist'

// 찜 규칙과 개수 파생만 검증한다. 순수 규칙이라 DOM 없이 잡는다.
// 이 파일은 cart를 import하지 않는다. 장바구니를 지워도 그대로 통과해야 한다.

describe('toggleWishlistId', () => {
  it('찜하지 않은 상품을 토글하면 목록 끝에 붙는다', () => {
    expect(toggleWishlistId(['p1'], 'p2')).toEqual(['p1', 'p2'])
  })

  it('이미 찜한 상품을 다시 토글하면 그 상품만 빠진다', () => {
    expect(toggleWishlistId(['p1', 'p2', 'p3'], 'p2')).toEqual(['p1', 'p3'])
  })

  it('같은 상품을 두 번 토글하면 원래 목록으로 돌아온다', () => {
    const once = toggleWishlistId(['p1'], 'p2')
    expect(toggleWishlistId(once, 'p2')).toEqual(['p1'])
  })

  it('원본 배열을 바꾸지 않고 새 배열을 만든다', () => {
    const before = ['p1']
    toggleWishlistId(before, 'p2')
    expect(before).toEqual(['p1'])
  })

  it('빈 목록에서 토글하면 그 상품 하나만 남는다', () => {
    expect(toggleWishlistId([], 'p1')).toEqual(['p1'])
  })
})

describe('wishlistCountOf', () => {
  it('찜한 ID 개수를 그대로 센다', () => {
    expect(wishlistCountOf(['p1', 'p2'])).toBe(2)
  })

  it('비어 있으면 0이다', () => {
    expect(wishlistCountOf([])).toBe(0)
  })

  it('토글로 뺀 뒤의 개수는 남은 ID 수와 같다', () => {
    expect(wishlistCountOf(toggleWishlistId(['p1', 'p2'], 'p1'))).toBe(1)
  })
})

describe('isInWishlistIds', () => {
  it('찜한 상품은 true, 찜하지 않은 상품은 false다', () => {
    expect(isInWishlistIds(['p1'], 'p1')).toBe(true)
    expect(isInWishlistIds(['p1'], 'p2')).toBe(false)
  })

  it('빈 목록에서는 어떤 상품도 찜되어 있지 않다', () => {
    expect(isInWishlistIds([], 'p1')).toBe(false)
  })
})
