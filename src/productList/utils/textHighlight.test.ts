import { describe, expect, it } from 'vitest'
import { splitHighlightedText } from './textHighlight'

describe('splitHighlightedText', () => {
  it('splits text into matched and unmatched parts case-insensitively', () => {
    expect(splitHighlightedText('Smart Watch', 'watch')).toEqual([
      { text: 'Smart ', isMatch: false },
      { text: 'Watch', isMatch: true },
    ])
  })

  it('treats regex characters in the query as plain text', () => {
    expect(splitHighlightedText('상품 [A]', '[')).toEqual([
      { text: '상품 ', isMatch: false },
      { text: '[', isMatch: true },
      { text: 'A]', isMatch: false },
    ])
  })
})
