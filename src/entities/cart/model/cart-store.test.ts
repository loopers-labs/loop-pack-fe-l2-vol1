import { beforeEach, describe, expect, it } from 'vitest'
import { selectCartItems, useCartStore } from '@/entities/cart'
import type { ProductSummary } from '@/entities/product/@x/cart'

const OWNER = 'test-user'

const product = (id: string, price = 1_000): ProductSummary => ({
  id,
  name: `상품 ${id}`,
  brand: '테스트 브랜드',
  image: `/${id}.png`,
  price,
})

// store가 모듈 전역이라 테스트 사이에 담긴 항목이 남는다. 소비처에서 setState를 쓰지 않는
// 규칙을 지키기 위해 store가 공개한 action으로만 비운다.
// 소유자가 없으면 아무것도 담기지 않으므로 테스트용 소유자를 먼저 세운다.
const items = () => selectCartItems(useCartStore.getState())

describe('cart store의 연산', () => {
  beforeEach(() => {
    useCartStore.getState().setOwner(OWNER)
    useCartStore.getState().clearAll()
  })

  it('처음 담는 상품은 수량 1로 들어간다', () => {
    useCartStore.getState().add(product('p1'))

    expect(items()).toEqual([{ ...product('p1'), quantity: 1 }])
  })

  it('이미 담긴 상품을 다시 담으면 항목이 늘지 않고 수량만 하나 오른다', () => {
    useCartStore.getState().add(product('p1'))
    useCartStore.getState().add(product('p1'))
    useCartStore.getState().add(product('p1'))

    expect(items()).toHaveLength(1)
    expect(items()[0].quantity).toBe(3)
  })

  it('다시 담을 때 표시 정보는 최신 값으로 갱신된다', () => {
    useCartStore.getState().add(product('p1', 1_000))
    useCartStore.getState().add(product('p1', 2_000))

    expect(items()[0].price).toBe(2_000)
  })

  it('remove는 지정한 상품만 뺀다', () => {
    useCartStore.getState().add(product('p1'))
    useCartStore.getState().add(product('p2'))

    useCartStore.getState().remove('p1')

    expect(items().map((item) => item.id)).toEqual(['p2'])
  })

  it('setQuantity는 수량을 지정한 값으로 바꾼다', () => {
    useCartStore.getState().add(product('p1'))

    useCartStore.getState().setQuantity('p1', 5)

    expect(items()[0].quantity).toBe(5)
  })

  // 주문 API가 1 이상의 정수만 받는다. 0으로 내리는 것은 수량 변경이 아니라 remove의 일이다.
  it.each([0, -1, 1.5, Number.NaN])('setQuantity는 %s를 무시한다', (quantity) => {
    useCartStore.getState().add(product('p1'))

    useCartStore.getState().setQuantity('p1', quantity)

    expect(items()[0].quantity).toBe(1)
  })

  it('clearAll은 담긴 상품을 모두 비운다', () => {
    useCartStore.getState().add(product('p1'))
    useCartStore.getState().add(product('p2'))

    useCartStore.getState().clearAll()

    expect(items()).toEqual([])
  })
})
