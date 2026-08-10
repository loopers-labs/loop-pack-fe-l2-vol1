import { describe, expect, it } from 'vitest'

import { parseAppOrigin } from './AppOrigin'
import {
  createPageOpenGraph,
  createSiteMetadata,
  SITE_METADATA,
} from './SiteMetadata'

describe('SiteMetadata', () => {
  it('creates the complete absolute root metadata contract', () => {
    const origin = parseAppOrigin('https://shop.example')

    expect(createSiteMetadata(origin)).toEqual({
      metadataBase: new URL('https://shop.example'),
      title: {
        default: 'Loopers Commerce',
        template: '%s | Loopers Commerce',
      },
      description: '취향에 맞는 상품을 발견하는 Loopers 커머스입니다.',
      alternates: { canonical: 'https://shop.example/' },
      robots: { index: true, follow: true },
      openGraph: {
        title: 'Loopers Commerce',
        description: '취향에 맞는 상품을 발견하는 Loopers 커머스입니다.',
        siteName: 'Loopers Commerce',
        locale: 'ko_KR',
        type: 'website',
        url: 'https://shop.example/',
        images: [
          { url: 'https://shop.example/images/week-07/hero-original.jpg' },
        ],
      },
    })
    expect(SITE_METADATA.fallbackImagePath).toBe(
      '/images/week-07/hero-original.jpg',
    )
  })

  it('spreads parent Open Graph before page overrides', () => {
    expect(
      createPageOpenGraph(
        {
          siteName: 'Loopers Commerce',
          locale: 'ko_KR',
          type: 'website',
          title: 'root',
        },
        {
          title: 'page',
          description: 'page description',
          url: 'https://shop.example/products',
          images: [{ url: 'https://shop.example/product.jpg' }],
        },
      ),
    ).toEqual({
      siteName: 'Loopers Commerce',
      locale: 'ko_KR',
      type: 'website',
      title: 'page',
      description: 'page description',
      url: 'https://shop.example/products',
      images: [{ url: 'https://shop.example/product.jpg' }],
    })
  })
})
