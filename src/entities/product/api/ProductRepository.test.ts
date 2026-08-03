import { describe, expect, it } from 'vitest'
import * as z from 'zod'

import { apiClient } from '@/shared/api/ApiClient'

import { ProductRepository } from './ProductRepository'

describe('ProductRepository successful response boundary', () => {
  it('throws a schema error without another attempt for malformed 2xx data', async () => {
    let attemptCount = 0
    const api = apiClient.extend({
      baseUrl: 'https://example.test/',
      fetch: () => {
        attemptCount += 1
        return Promise.resolve(
          new Response(JSON.stringify({ unexpected: true }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
        )
      },
    })
    const repository = new ProductRepository(api)

    await expect(repository.getHome()).rejects.toBeInstanceOf(z.ZodError)
    expect(attemptCount).toBe(1)
  })
})
