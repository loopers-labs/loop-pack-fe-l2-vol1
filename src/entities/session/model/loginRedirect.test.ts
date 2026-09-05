import { describe, expect, it } from 'vitest'
import {
  DEFAULT_NEXT_PATH,
  LOGIN_PATH,
  loginPathFor,
  safeNextPath,
} from './loginRedirect'

// 복원 경로는 밖에서 들어오는 값이다. 통과시킬 것과 막을 것을 고정한다.
// 실제로 302가 나가는지는 E2E에서 확인한다.

describe('safeNextPath', () => {
  it('앱 안의 경로는 그대로 통과시킨다', () => {
    expect(safeNextPath('/orders/new')).toBe('/orders/new')
  })

  it('쿼리는 경로의 일부로 함께 보존한다', () => {
    expect(safeNextPath('/products?category=casual&page=2')).toBe(
      '/products?category=casual&page=2',
    )
  })

  it('절대 URL은 막고 기본 경로로 돌린다', () => {
    expect(safeNextPath('https://evil.example/steal')).toBe(DEFAULT_NEXT_PATH)
  })

  it('스킴 없는 //호스트 형태를 막는다', () => {
    expect(safeNextPath('//evil.example/steal')).toBe(DEFAULT_NEXT_PATH)
  })

  it('백슬래시로 시작하는 형태를 막는다', () => {
    // 파서가 백슬래시를 슬래시로 정규화해 //evil.example이 된다.
    expect(safeNextPath('/\\evil.example')).toBe(DEFAULT_NEXT_PATH)
  })

  it('상대 경로는 목적지가 화면마다 달라지므로 막는다', () => {
    expect(safeNextPath('orders/new')).toBe(DEFAULT_NEXT_PATH)
  })

  it('빈 값과 없는 값은 기본 경로가 된다', () => {
    expect(safeNextPath('')).toBe(DEFAULT_NEXT_PATH)
    expect(safeNextPath(null)).toBe(DEFAULT_NEXT_PATH)
    expect(safeNextPath(undefined)).toBe(DEFAULT_NEXT_PATH)
  })

  it('로그인 화면 자신으로는 돌아가지 않는다', () => {
    // 통과시키면 로그인 성공 후 같은 화면이 다시 나온다.
    expect(safeNextPath(LOGIN_PATH)).toBe(DEFAULT_NEXT_PATH)
    expect(safeNextPath('/login?next=%2Forders')).toBe(DEFAULT_NEXT_PATH)
  })

  it('막았을 때 쓸 경로를 호출자가 정할 수 있다', () => {
    expect(safeNextPath('https://evil.example', '/orders')).toBe('/orders')
  })
})

describe('loginPathFor', () => {
  it('복원 경로를 next 파라미터에 인코딩해 싣는다', () => {
    expect(loginPathFor('/orders/new')).toBe('/login?next=%2Forders%2Fnew')
  })

  it('기본 경로로 돌아갈 때는 파라미터를 붙이지 않는다', () => {
    // 없어도 되는 값을 실으면 로그인 주소 형태가 둘로 갈린다.
    expect(loginPathFor(DEFAULT_NEXT_PATH)).toBe(LOGIN_PATH)
    expect(loginPathFor(null)).toBe(LOGIN_PATH)
  })

  it('막아야 하는 값은 링크를 만드는 자리에서도 걸러진다', () => {
    expect(loginPathFor('https://evil.example')).toBe(LOGIN_PATH)
  })
})
