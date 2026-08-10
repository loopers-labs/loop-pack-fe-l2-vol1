import { describe, expect, it } from 'vitest'

import { parseAppOrigin } from '@/shared/config/AppOrigin'

import { ProductListRequestModel } from './ProductListRequest'
import { ProductQueryKeyFactory } from './ProductQueryKeyFactory'

const defaultRequest = {
  q: '',
  category: 'all',
  sort: 'latest',
  page: 1,
  pageSize: 12,
} as const

describe('ProductListRequestModel.normalize', () => {
  it.each([undefined, null, [], 'q=stanley', 1])(
    'defaults non-record input %#',
    (input) => {
      expect(ProductListRequestModel.normalize(input)).toEqual(defaultRequest)
    },
  )

  it('accepts scalar strings and canonical numeric inputs', () => {
    const request = ProductListRequestModel.normalize({
      q: '  stanley & sons  ',
      category: 'home',
      sort: 'price-asc',
      page: '2',
      pageSize: 24,
      scenario: 'slow',
    })

    expect(request).toEqual({
      q: '  stanley & sons  ',
      category: 'home',
      sort: 'price-asc',
      page: 2,
      pageSize: 24,
      scenario: 'slow',
    })
    expect(Object.isFrozen(request)).toBe(true)
  })

  it('rejects arrays and non-string scalar fields without leaking scenario', () => {
    const request = ProductListRequestModel.normalize({
      q: ['stanley'],
      category: ['home'],
      sort: 1,
      scenario: null,
    })

    expect(request).toEqual(defaultRequest)
    expect(Object.hasOwn(request, 'scenario')).toBe(false)
  })

  it.each([
    ['zero', 0],
    ['negative', -1],
    ['float', 1.5],
    ['unsafe number', Number.MAX_SAFE_INTEGER + 1],
    ['signed string', '+2'],
    ['leading zero', '02'],
    ['decimal string', '2.0'],
    ['exponent string', '2e1'],
    ['whitespace string', ' 2'],
    ['unsafe string', '9007199254740992'],
    ['array', ['2']],
  ])('defaults a non-canonical page: %s', (_label, page) => {
    expect(ProductListRequestModel.normalize({ page }).page).toBe(1)
  })

  it.each([
    ['zero', 0],
    ['over max', 25],
    ['leading zero', '024'],
    ['unsafe', Number.MAX_SAFE_INTEGER],
  ])('defaults an invalid page size: %s', (_label, pageSize) => {
    expect(ProductListRequestModel.normalize({ pageSize }).pageSize).toBe(12)
  })
})

describe('ProductListRequestModel identity and encoding', () => {
  it('uses the normalized request as the complete deterministic key', () => {
    const first = ProductListRequestModel.normalize({ scenario: 'empty' })
    const second = ProductListRequestModel.normalize({
      q: '',
      category: 'all',
      sort: 'latest',
      page: '1',
      pageSize: '12',
      scenario: 'empty',
    })

    expect(ProductQueryKeyFactory.productList(first)).toEqual([
      'products',
      'list',
      first,
    ])
    expect(ProductQueryKeyFactory.productList(first)).toEqual(
      ProductQueryKeyFactory.productList(second),
    )
  })

  it.each([
    ['q', { q: 'stanley' }],
    ['category', { category: 'home' }],
    ['sort', { sort: 'popular' }],
    ['page', { page: 2 }],
    ['pageSize', { pageSize: 24 }],
    ['scenario', { scenario: 'slow' }],
  ])('changes identity when %s changes', (_field, input) => {
    const current = ProductQueryKeyFactory.productList(
      ProductListRequestModel.normalize({}),
    )
    const changed = ProductQueryKeyFactory.productList(
      ProductListRequestModel.normalize(input),
    )

    expect(changed).not.toEqual(current)
  })

  it('omits q/all and encodes remaining fields in canonical order', () => {
    const request = ProductListRequestModel.normalize({
      q: '한 글 & slash/plus+',
      category: 'all',
      sort: 'price-desc',
      page: 2,
      pageSize: 24,
      scenario: 'empty',
    })

    expect(ProductListRequestModel.searchParams(request).toString()).toBe(
      'q=%ED%95%9C+%EA%B8%80+%26+slash%2Fplus%2B&sort=price-desc&page=2&pageSize=24&scenario=empty',
    )
    expect(
      ProductListRequestModel.searchParams(
        ProductListRequestModel.normalize({}),
      ).toString(),
    ).toBe('sort=latest&page=1&pageSize=12')
  })
})

describe('ProductListRequestModel transport descriptors', () => {
  it('builds a relative browser descriptor and only includes a supplied signal', () => {
    const request = ProductListRequestModel.normalize({ q: 'stanley' })
    const controller = new AbortController()
    const signalFree = ProductListRequestModel.browserDescriptor(request)
    const signaled = ProductListRequestModel.browserDescriptor(
      request,
      controller.signal,
    )
    const searchParams = signalFree.options.searchParams

    expect(signalFree.input).toBe('api/products')
    expect(searchParams).toBeInstanceOf(URLSearchParams)
    if (!(searchParams instanceof URLSearchParams)) {
      return
    }
    expect(searchParams.toString()).toBe(
      'q=stanley&sort=latest&page=1&pageSize=12',
    )
    expect(Object.hasOwn(signalFree.options, 'signal')).toBe(false)
    expect(signaled.options.signal).toBe(controller.signal)
  })

  it('builds repeatable absolute native descriptors with no signal property', () => {
    const origin = parseAppOrigin('https://shop.example:8443/')
    const request = ProductListRequestModel.normalize({
      q: 'stanley',
      category: 'home',
      scenario: 'slow',
    })
    const browser = ProductListRequestModel.browserDescriptor(request)
    const metadata = ProductListRequestModel.serverDescriptor(request, origin)
    const body = ProductListRequestModel.serverDescriptor(request, origin)
    const resolvedBrowserUrl = new URL(browser.input, `${origin}/`)
    const searchParams = browser.options.searchParams
    expect(searchParams).toBeInstanceOf(URLSearchParams)
    if (!(searchParams instanceof URLSearchParams)) {
      return
    }
    resolvedBrowserUrl.search = searchParams.toString()

    expect(metadata.input.href).toBe(
      'https://shop.example:8443/api/products?q=stanley&category=home&sort=latest&page=1&pageSize=12&scenario=slow',
    )
    expect(metadata.input.pathname + metadata.input.search).toBe(
      resolvedBrowserUrl.pathname + resolvedBrowserUrl.search,
    )
    expect({ href: metadata.input.href, init: metadata.init }).toEqual({
      href: body.input.href,
      init: body.init,
    })
    expect(metadata.init).toEqual({ method: 'GET' })
    expect(Object.hasOwn(metadata.init, 'signal')).toBe(false)
    expect(Object.hasOwn(body.init, 'signal')).toBe(false)
  })
})
