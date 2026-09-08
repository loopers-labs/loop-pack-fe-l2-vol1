export type RouteSearchParams = Record<string, string | string[] | undefined>

export function buildProtectedReturnPath(
  pathname: string,
  searchParams?: RouteSearchParams,
): string {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (Array.isArray(value)) {
      value.forEach((entry) => query.append(key, entry))
    } else if (value !== undefined) {
      query.set(key, value)
    }
  }

  const serializedQuery = query.toString()
  return serializedQuery === '' ? pathname : `${pathname}?${serializedQuery}`
}
