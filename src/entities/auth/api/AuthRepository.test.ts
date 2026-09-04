import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import * as z from 'zod'

import { apiClient } from '@/shared/api/ApiClient'
import { ApiClientError } from '@/shared/api/ApiClientError'

import { server } from '../../../../tests/setup/mswServer'
import { AuthRepository } from './AuthRepository'

const nodeApiClient = apiClient.extend({ baseUrl: 'https://example.test/' })
const user = {
  id: 'u1',
  name: '루퍼1',
  email: 'looper1@loopers.dev',
} as const

describe('AuthRepository login boundary', () => {
  it('posts the validated credentials and parses the session response', async () => {
    let requestBody: unknown
    server.use(
      http.post('https://example.test/api/auth/login', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ user })
      }),
    )

    const response = await new AuthRepository(nodeApiClient).login({
      email: 'looper1@loopers.dev',
      password: 'looper1234',
    })

    expect(requestBody).toEqual({
      email: 'looper1@loopers.dev',
      password: 'looper1234',
    })
    expect(response).toEqual({ user })
  })

  it('rejects malformed successful response data', async () => {
    server.use(
      http.post('https://example.test/api/auth/login', () =>
        HttpResponse.json({ user: { id: 'u1' } }),
      ),
    )

    const request = new AuthRepository(nodeApiClient).login({
      email: 'looper1@loopers.dev',
      password: 'looper1234',
    })

    await expect(request).rejects.toBeInstanceOf(z.ZodError)
  })

  it('preserves credential failure status at the API boundary', async () => {
    server.use(
      http.post('https://example.test/api/auth/login', () =>
        HttpResponse.json(
          { message: '이메일 또는 비밀번호가 올바르지 않습니다.' },
          { status: 401 },
        ),
      ),
    )

    const request = new AuthRepository(nodeApiClient).login({
      email: 'looper1@loopers.dev',
      password: 'wrong-password',
    })

    await expect(request).rejects.toBeInstanceOf(ApiClientError)
    await expect(request).rejects.toMatchObject({ status: 401 })
  })
})

describe('AuthRepository session boundary', () => {
  it('parses the current user response', async () => {
    server.use(
      http.get('https://example.test/api/auth/me', () =>
        HttpResponse.json({ user }),
      ),
    )

    await expect(new AuthRepository(nodeApiClient).me()).resolves.toEqual({
      user,
    })
  })

  it('accepts the empty logout response', async () => {
    server.use(
      http.post(
        'https://example.test/api/auth/logout',
        () => new HttpResponse(null, { status: 204 }),
      ),
    )

    await expect(
      new AuthRepository(nodeApiClient).logout(),
    ).resolves.toBeUndefined()
  })
})
