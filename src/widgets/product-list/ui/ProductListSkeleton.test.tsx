import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import {
  ProductListGeometrySlots,
  ProductListSkeleton,
} from './ProductListSkeleton'

describe('ProductListSkeleton', () => {
  it('renders twelve aria-hidden card-shaped slots', () => {
    const markup = renderToStaticMarkup(<ProductListSkeleton />)

    expect(markup.match(/data-product-skeleton-slot="true"/g)).toHaveLength(12)
    expect(markup).toContain('aria-hidden="true"')
    expect(markup).toContain('grid-cols-2')
    expect(markup).toContain('sm:grid-cols-3')
    expect(markup).toContain('lg:grid-cols-5')
    expect(markup).toContain('aspect-square')
    expect(markup).toContain('h-9.5')
    expect(markup).toContain('h-8.5')
    expect(markup).not.toContain('role=')
    expect(markup).not.toContain('<button')
    expect(markup).not.toMatch(/<a(?:\s|>)/)
  })
})

describe('ProductListGeometrySlots', () => {
  it('renders only the missing invisible slots', () => {
    const markup = renderToStaticMarkup(
      <ProductListGeometrySlots visibleProductCount={3} />,
    )

    expect(markup.match(/data-product-geometry-slot="true"/g)).toHaveLength(9)
    expect(markup).toContain('invisible')
    expect(markup).toContain('aria-hidden="true"')
    expect(markup).not.toContain('animate-')
  })
})
