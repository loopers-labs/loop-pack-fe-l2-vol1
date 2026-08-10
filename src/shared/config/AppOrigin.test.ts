import { describe, expect, it } from 'vitest'

import { AppOriginError, parseAppOrigin } from './AppOrigin'

describe('parseAppOrigin', () => {
  it.each([
    ['https origin', 'https://shop.example', 'https://shop.example'],
    ['trailing slash', 'https://shop.example/', 'https://shop.example'],
    ['HTTP default port', 'http://shop.example:80', 'http://shop.example'],
    ['HTTPS default port', 'https://shop.example:443', 'https://shop.example'],
    [
      'non-default port',
      'https://shop.example:8443/',
      'https://shop.example:8443',
    ],
    ['loopback', 'http://127.0.0.1:3000/', 'http://127.0.0.1:3000'],
  ])('normalizes a valid %s', (_label, input, expected) => {
    expect(parseAppOrigin(input)).toBe(expected)
  })

  it.each([undefined, '', '   '])('rejects a missing origin %#', (input) => {
    expect(() => parseAppOrigin(input)).toThrow(
      new AppOriginError('APP_ORIGIN is required.'),
    )
  })

  it.each([
    ['non-string', 42],
    ['relative', '/products'],
    ['other protocol', 'ftp://shop.example'],
    ['username', 'https://user@shop.example'],
    ['password', 'https://user:secret@shop.example'],
    ['path', 'https://shop.example/products'],
    ['query', 'https://shop.example/?q=1'],
    ['bare query', 'https://shop.example/?'],
    ['hash', 'https://shop.example/#section'],
    ['bare hash', 'https://shop.example/#'],
    ['leading whitespace', ' https://shop.example'],
    ['trailing whitespace', 'https://shop.example '],
  ])('rejects invalid input: %s', (_label, input) => {
    expect(() => parseAppOrigin(input)).toThrow(
      new AppOriginError(
        'APP_ORIGIN must be an absolute HTTP(S) origin without credentials, path, query, or hash.',
      ),
    )
  })

  it('throws a stable typed error without exposing input', () => {
    const secretInput = 'https://user:secret@shop.example'

    expect(() => parseAppOrigin(secretInput)).toThrow(AppOriginError)
    try {
      parseAppOrigin(secretInput)
    } catch (error) {
      expect(error).toBeInstanceOf(AppOriginError)
      expect(error).toHaveProperty('name', 'AppOriginError')
      expect(error).not.toHaveProperty(
        'message',
        expect.stringContaining('secret'),
      )
    }
  })
})
