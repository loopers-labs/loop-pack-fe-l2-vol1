import { beforeEach, describe, expect, it } from 'vitest'
import { selectWishlistItems, useWishlistStore, type WishlistItem } from '@/entities/wishlist'

const OWNER = 'test-user'

const product = (id: string): WishlistItem => ({
  id,
  name: `상품 ${id}`,
  brand: '테스트 브랜드',
  image: `/${id}.png`,
  price: 1_000,
})

const items = () => selectWishlistItems(useWishlistStore.getState())

describe('wishlist store의 연산', () => {
  beforeEach(() => {
    useWishlistStore.getState().setOwner(OWNER)

    // 위시리스트에는 clearAll이 없다. 찜은 켜고 끄는 동작이라 toggle만 두었고,
    // 전체 비우기는 장바구니 화면에만 있는 요구다.
    for (const item of items()) {
      useWishlistStore.getState().toggle(item)
    }
  })

  it('찜하지 않은 상품을 toggle하면 추가된다', () => {
    useWishlistStore.getState().toggle(product('p1'))

    expect(items()).toEqual([product('p1')])
  })

  it('이미 찜한 상품을 다시 toggle하면 제거된다', () => {
    useWishlistStore.getState().toggle(product('p1'))
    useWishlistStore.getState().toggle(product('p1'))

    expect(items()).toEqual([])
  })

  it('toggle은 지정한 상품만 끄고 나머지는 남긴다', () => {
    useWishlistStore.getState().toggle(product('p1'))
    useWishlistStore.getState().toggle(product('p2'))

    useWishlistStore.getState().toggle(product('p1'))

    expect(items().map((item) => item.id)).toEqual(['p2'])
  })
})
