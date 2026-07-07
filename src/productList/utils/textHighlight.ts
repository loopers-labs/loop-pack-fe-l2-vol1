export type HighlightedTextPart = {
  text: string
  isMatch: boolean
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function splitHighlightedText(
  text: string,
  query: string,
): HighlightedTextPart[] {
  if (!query) {
    return [{ text, isMatch: false }]
  }

  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'gi'))

  return parts
    .filter((part) => part.length > 0)
    .map((part) => ({
      text: part,
      isMatch: part.toLowerCase() === query.toLowerCase(),
    }))
}
