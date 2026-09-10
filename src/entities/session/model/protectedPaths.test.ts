import { describe, expect, it } from 'vitest'
import { isProtectedPath } from './protectedPaths'

describe('isProtectedPath', () => {
  it('주문 내역과 주문서는 로그인을 요구한다', () => {
    expect(isProtectedPath('/orders')).toBe(true)
    expect(isProtectedPath('/orders/new')).toBe(true)
  })

  it('경계 문자까지 보고 판정한다', () => {
    // 접두사만 비교하면 무관한 경로까지 로그인 뒤로 들어간다.
    expect(isProtectedPath('/ordersomething')).toBe(false)
  })

  it('익명으로 쓸 수 있는 화면은 막지 않는다', () => {
    expect(isProtectedPath('/')).toBe(false)
    expect(isProtectedPath('/products')).toBe(false)
    expect(isProtectedPath('/login')).toBe(false)
  })
})
