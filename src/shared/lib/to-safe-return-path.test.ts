import { describe, expect, it } from 'vitest'
import { toSafeReturnPath } from '@/shared/lib/to-safe-return-path'

describe('toSafeReturnPath', () => {
  it.each(['/checkout', '/orders', '/products?category=living&sort=popular', '/cart#summary'])(
    '내부 경로 %s는 그대로 통과시킨다',
    (path) => {
      expect(toSafeReturnPath(path)).toBe(path)
    },
  )

  it.each([
    // 프로토콜 상대 URL. `/`로 시작해 경로처럼 보이지만 외부로 나간다.
    '//evil.com',
    // 절대 URL.
    'https://evil.com',
    'http://evil.com/checkout',
    // 백슬래시는 브라우저가 슬래시로 정규화하므로 `//evil.com`과 같다.
    '/\\evil.com',
    '\\\\evil.com',
    // 경로가 아닌 값.
    'checkout',
    '',
  ])('외부로 나가는 값 %s는 홈으로 대체한다', (value) => {
    expect(toSafeReturnPath(value)).toBe('/')
  })

  it.each([null, undefined])('값이 없으면 홈으로 대체한다 (%s)', (value) => {
    expect(toSafeReturnPath(value)).toBe('/')
  })
})
