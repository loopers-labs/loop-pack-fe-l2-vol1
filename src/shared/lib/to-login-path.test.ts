import { describe, expect, it } from 'vitest'
import { LOGIN_REASON, isLoginReason, toLoginPath } from '@/shared/lib/to-login-path'

describe('toLoginPath', () => {
  it('복원 경로와 로그인 유입 정보를 URL에 싣는다', () => {
    expect(
      toLoginPath('/products?category=fashion', {
        entryPoint: 'product_cart',
        productId: 'p1',
      }),
    ).toBe('/login?returnUrl=%2Fproducts%3Fcategory%3Dfashion&entryPoint=product_cart&productId=p1')
  })

  it('세션 만료 사유를 복원 경로와 함께 URL에 싣는다', () => {
    expect(toLoginPath('/cart', { reason: LOGIN_REASON.SESSION_EXPIRED })).toBe(
      '/login?returnUrl=%2Fcart&reason=session_expired',
    )
  })
})

describe('isLoginReason', () => {
  it('지원하는 세션 만료 사유만 통과시킨다', () => {
    expect(isLoginReason('session_expired')).toBe(true)
    expect(isLoginReason('unknown')).toBe(false)
    expect(isLoginReason(['session_expired'])).toBe(false)
  })
})
