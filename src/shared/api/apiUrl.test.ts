import { describe, expect, it } from 'vitest'
import { apiUrl } from './apiUrl'

// 조립은 이 함수 하나만 한다. 각자 조립하면 같은 조건인데 다른 요청이 나간다.

describe('apiUrl', () => {
  it('origin이 없으면 브라우저가 쓰는 상대 경로를 그대로 둔다', () => {
    expect(apiUrl('/api/home')).toBe('/api/home')
    expect(apiUrl('/api/products?page=2')).toBe('/api/products?page=2')
  })

  it('origin이 있으면 절대 URL로 만든다', () => {
    expect(apiUrl('/api/home', 'http://127.0.0.1:3210')).toBe(
      'http://127.0.0.1:3210/api/home',
    )
  })

  it('origin 끝의 슬래시 유무와 상관없이 같은 URL이 된다', () => {
    expect(apiUrl('/api/home', 'http://127.0.0.1:3210/')).toBe(
      apiUrl('/api/home', 'http://127.0.0.1:3210'),
    )
  })

  it('query string을 잃지 않는다', () => {
    expect(apiUrl('/api/products?page=2&sort=latest', 'http://x.test')).toBe(
      'http://x.test/api/products?page=2&sort=latest',
    )
  })
})
