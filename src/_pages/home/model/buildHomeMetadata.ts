import type { Metadata } from 'next'
import type { HomeResponse } from '@/entities/product'
import { buildPageMetadata } from '@/shared/config/siteMetadata'

export function buildHomeMetadata(home: HomeResponse): Metadata {
  return buildPageMetadata({
    title: home.banner.title,
    description: home.banner.description,
    image: home.banner.image,
  })
}
