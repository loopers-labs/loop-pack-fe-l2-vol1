import { afterEach, describe, expect, it, vi } from 'vitest'
import { getAppOrigin } from './appOrigin'

// 여기서 걸러야 할 것은 설정 오류뿐이다. 조회 실패는 원인이 다르고 호출한 쪽이 다룬다.
// 잘못된 값이 조용히 넘어가면 틀린 절대 URL이 결과물에 굳는다.

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('APP_ORIGIN', () => {
  it('끝의 슬래시나 경로가 있어도 같은 origin을 만든다', () => {
    vi.stubEnv('APP_ORIGIN', 'http://127.0.0.1:3210')
    expect(getAppOrigin()).toBe('http://127.0.0.1:3210')

    vi.stubEnv('APP_ORIGIN', 'http://127.0.0.1:3210/')
    expect(getAppOrigin()).toBe('http://127.0.0.1:3210')

    vi.stubEnv('APP_ORIGIN', 'http://127.0.0.1:3210/base/')
    expect(getAppOrigin()).toBe('http://127.0.0.1:3210')
  })

  it('값이 없으면 기본값으로 넘어가지 않고 실패한다', () => {
    vi.stubEnv('APP_ORIGIN', '')
    expect(() => getAppOrigin()).toThrow(/APP_ORIGIN is not set/)
  })

  it('절대 URL이 아니면 실패한다', () => {
    vi.stubEnv('APP_ORIGIN', '127.0.0.1:3210')
    expect(() => getAppOrigin()).toThrow(/not a valid URL/)
  })

  it('http나 https가 아니면 실패한다', () => {
    vi.stubEnv('APP_ORIGIN', 'ftp://127.0.0.1:3210')
    expect(() => getAppOrigin()).toThrow(/http or https/)
  })

  it('무엇을 어떻게 넣어야 하는지 메시지로 알린다', () => {
    vi.stubEnv('APP_ORIGIN', '')
    expect(() => getAppOrigin()).toThrow(
      /Set the same value for build and runtime/,
    )
  })
})
