import type { Metadata } from 'next'

export const OPEN_GRAPH_FALLBACK_IMAGE = '/images/products/p1.jpg'

export const COMMON_OPEN_GRAPH = {
  siteName: 'Loopers',
  locale: 'ko_KR',
  type: 'website',
  images: [OPEN_GRAPH_FALLBACK_IMAGE],
} satisfies NonNullable<Metadata['openGraph']>

interface BuildPageMetadataParams {
  title: string
  description: string
  image?: string
}

export function buildPageMetadata({
  title,
  description,
  image,
}: BuildPageMetadataParams): Metadata {
  return {
    title,
    description,
    openGraph: {
      ...COMMON_OPEN_GRAPH,
      title,
      description,
      images: [image ?? OPEN_GRAPH_FALLBACK_IMAGE],
    },
  }
}
