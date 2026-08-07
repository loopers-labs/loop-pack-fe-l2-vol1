import { Children, isValidElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { ProductServerService } from '@/entities/product/api/ProductServerService'

vi.mock('server-only', () => ({}))

import Home, { HomeHydration } from './page'

function renderSynchronous(element: ReactNode | Promise<ReactNode>) {
  if (element instanceof Promise) {
    throw new Error('Home must return the semantic shell synchronously')
  }

  return renderToStaticMarkup(element)
}

function hasClientOnlyBoundary(node: ReactNode): boolean {
  if (
    !isValidElement<{
      readonly clientOnly?: boolean
      readonly children?: ReactNode
    }>(node)
  ) {
    return false
  }
  if (node.props.clientOnly === true) {
    return true
  }
  return Children.toArray(node.props.children).some(hasClientOnlyBoundary)
}

describe('Home page semantic shell', () => {
  it('renders the page meaning and fixed Hero fallback before data resolves', () => {
    const homePage = Home({
      searchParams: Promise.resolve({ scenario: 'slow' }),
    })

    const markup = renderSynchronous(homePage)

    expect(markup.match(/<main\b/g)).toHaveLength(1)
    expect(markup.match(/<h1\b/g)).toHaveLength(1)
    expect(markup).toContain('Loopers Commerce')
    expect(markup).toContain('취향에 맞는 상품을 발견해보세요.')
    expect(markup).toContain('role="status"')
    expect(markup).toContain('aria-live="polite"')
    expect(markup).toContain('홈 데이터를 불러오는 중…')
    expect(markup).toContain('[aspect-ratio:16/9]')
    expect(markup).toContain('[@media(max-width:640px)]:[aspect-ratio:4/5]')
    expect(markup).not.toContain('<h2')
    expect(markup).not.toContain('/images/week-07/hero-original.jpg')
  })

  it('skips deterministic error scenario server prefetch', async () => {
    const getHome = vi.spyOn(ProductServerService.prototype, 'getHome')

    await HomeHydration({
      searchParams: Promise.resolve({ scenario: 'error' }),
    })

    expect(getHome).not.toHaveBeenCalled()
  })

  it('keeps the browser home repository out of server rendering', () => {
    const homePage = Home({ searchParams: Promise.resolve({}) })

    expect(hasClientOnlyBoundary(homePage)).toBe(true)
  })
})
