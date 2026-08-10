import type { Metadata } from 'next'

import type { AppOrigin } from './AppOrigin'

export const SITE_METADATA = {
  title: 'Loopers Commerce',
  titleTemplate: '%s | Loopers Commerce',
  description: '취향에 맞는 상품을 발견하는 Loopers 커머스입니다.',
  siteName: 'Loopers Commerce',
  locale: 'ko_KR',
  type: 'website',
  fallbackImagePath: '/images/week-07/hero-original.jpg',
  rootPath: '/',
} as const

export type PageOpenGraphInput = Readonly<{
  title: string
  description: string
  url: string
  images: NonNullable<Metadata['openGraph']>['images']
}>

export function createPageOpenGraph(
  parentOpenGraph: Metadata['openGraph'],
  input: PageOpenGraphInput,
): NonNullable<Metadata['openGraph']> {
  return {
    ...parentOpenGraph,
    title: input.title,
    description: input.description,
    url: input.url,
    images: input.images,
  }
}

export function createSiteMetadata(origin: AppOrigin): Metadata {
  const rootUrl = new URL(SITE_METADATA.rootPath, `${origin}/`).href
  const fallbackImageUrl = new URL(
    SITE_METADATA.fallbackImagePath,
    `${origin}/`,
  ).href

  return {
    metadataBase: new URL(origin),
    title: {
      default: SITE_METADATA.title,
      template: SITE_METADATA.titleTemplate,
    },
    description: SITE_METADATA.description,
    alternates: { canonical: rootUrl },
    robots: { index: true, follow: true },
    openGraph: {
      title: SITE_METADATA.title,
      description: SITE_METADATA.description,
      siteName: SITE_METADATA.siteName,
      locale: SITE_METADATA.locale,
      type: SITE_METADATA.type,
      url: rootUrl,
      images: [{ url: fallbackImageUrl }],
    },
  }
}
