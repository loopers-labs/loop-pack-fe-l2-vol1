import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import * as z from 'zod'

import { ProductServerFetchError } from '@/entities/product/api/ProductServerFetchError'
import type { HomeResponse } from '@/entities/product/model/types'
import { ApiClientError } from '@/shared/api/ApiClientError'
import { parseAppOrigin } from '@/shared/config/AppOrigin'
import { createResolvingMetadataFixture } from '@/shared/config/ResolvingMetadataFixture.test-helper'

import { buildHomeMetadata } from './HomeMetadata'

const origin = parseAppOrigin('https://shop.example')
const data: HomeResponse = {
  banner: {
    title: '매일 새롭게 발견하는 취향',
    description: '오늘의 취향을 발견하세요.',
    image: '/hero.jpg',
  },
  categories: [],
  popularProducts: [],
  newProducts: [],
}
const parent = createResolvingMetadataFixture()

describe('buildHomeMetadata', () => {
  it('maps banner metadata with an absolute same-segment title and parent OG', async () => {
    const client = new QueryClient()
    const getQueryClient = vi.fn(() => client)
    const loadHome = vi.fn(() => Promise.resolve(data))

    await expect(
      buildHomeMetadata(
        { origin, diagnosticScenario: { scenario: 'empty' }, parent },
        { getQueryClient, loadHome },
      ),
    ).resolves.toMatchObject({
      title: { absolute: '매일 새롭게 발견하는 취향 | Loopers Commerce' },
      description: '오늘의 취향을 발견하세요.',
      alternates: { canonical: 'https://shop.example/' },
      openGraph: {
        title: '매일 새롭게 발견하는 취향',
        description: '오늘의 취향을 발견하세요.',
        siteName: 'Loopers Commerce',
        locale: 'ko_KR',
        type: 'website',
        url: 'https://shop.example/',
        images: [{ url: 'https://shop.example/hero.jpg' }],
      },
    })
    expect(getQueryClient).toHaveBeenCalledTimes(1)
    expect(loadHome).toHaveBeenCalledWith(client, { scenario: 'empty' }, origin)
  })

  it.each([
    new ApiClientError('expected', 503),
    new ProductServerFetchError(new TypeError('fetch failed')),
  ])('returns root inheritance for expected query failure', async (error) => {
    await expect(
      buildHomeMetadata(
        { origin, diagnosticScenario: {}, parent },
        {
          getQueryClient: () => new QueryClient(),
          loadHome: () => Promise.reject(error),
        },
      ),
    ).resolves.toEqual({})
  })

  it.each([
    new SyntaxError('malformed'),
    new z.ZodError([]),
    new TypeError('programming error'),
  ])('rethrows unexpected loader failure', async (error) => {
    await expect(
      buildHomeMetadata(
        { origin, diagnosticScenario: {}, parent },
        {
          getQueryClient: () => new QueryClient(),
          loadHome: () => Promise.reject(error),
        },
      ),
    ).rejects.toBe(error)
  })
})
