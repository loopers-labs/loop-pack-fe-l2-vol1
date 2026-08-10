import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import Loading from './loading'

describe('Products loading shell', () => {
  it('reserves final geometry without fake controls or focusable elements', () => {
    const markup = renderToStaticMarkup(<Loading />)

    expect(markup.match(/<main\b/g)).toHaveLength(1)
    expect(markup.match(/<h1\b/g)).toHaveLength(1)
    expect(markup).toContain('상품 목록')
    expect(markup).toContain('aria-label="상품 검색 결과"')
    expect(markup).toContain('상품 목록을 불러오는 중…')
    expect(markup.match(/data-product-skeleton-slot="true"/g)).toHaveLength(12)
    expect(markup).toContain('data-product-filter-shell="true"')
    expect(markup).toContain('data-home-link-shell="true"')
    expect(markup).toContain('grid-cols-2')
    expect(markup).toContain('sm:grid-cols-3')
    expect(markup).toContain('lg:grid-cols-5')
    expect(markup).not.toMatch(/<(?:input|select|button|form|a)\b/)
    expect(markup).not.toContain('tabindex=')
    expect(markup).not.toContain('role="link"')
  })
})
