import { afterEach, describe, expect, it, vi } from 'vitest'
import { login, logout } from './authClient'

const credentials = {
  email: 'looper1@loopers.dev',
  password: 'looper1234',
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('authClient', () => {
  it('rejects a malformed successful login response with the default error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json(
          {
            user: {
              id: 'user-1',
              name: '루퍼1',
            },
          },
          { status: 200 },
        ),
      ),
    )

    await expect(login(credentials)).rejects.toMatchObject({
      name: 'ApiError',
      status: 200,
      message: '로그인에 실패했습니다.',
    })
  })

  it('uses the default login error when an error response message is malformed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json(
          {
            message: 42,
          },
          { status: 401 },
        ),
      ),
    )

    await expect(login(credentials)).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      message: '로그인에 실패했습니다.',
    })
  })

  it('uses the default logout error when an error response message is malformed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json(
          {
            message: false,
          },
          { status: 500 },
        ),
      ),
    )

    await expect(logout()).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
      message: '로그아웃에 실패했습니다.',
    })
  })
})
