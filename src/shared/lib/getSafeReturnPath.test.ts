import { describe, expect, it } from 'vitest'
import { getSafeReturnPath } from './getSafeReturnPath'

describe('getSafeReturnPath', () => {
  it.each([
    ['/checkout', '/checkout'],
    ['/orders?page=2', '/orders?page=2'],
  ])('keeps an internal return path for %s', (value, expected) => {
    expect(getSafeReturnPath(value)).toBe(expected)
  })

  it.each([
    'https://evil.example',
    '//evil.example',
    '\\evil.example',
    'javascript:alert(1)',
    null,
  ])('falls back to the homepage for an unsafe return path: %s', (value) => {
    expect(getSafeReturnPath(value)).toBe('/')
  })
})
