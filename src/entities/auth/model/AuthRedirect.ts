type NextValue = string | ReadonlyArray<string> | undefined

const internalOrigin = 'https://internal.invalid'
const protectedPathRoots = ['/checkout', '/orders'] as const

const isProtectedPath = (pathname: string): boolean =>
  protectedPathRoots.some(
    (root) => pathname === root || pathname.startsWith(`${root}/`),
  )

const resolveNext = (value: NextValue): string => {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\')
  ) {
    return '/'
  }

  let url: URL
  try {
    url = new URL(value, internalOrigin)
  } catch {
    return '/'
  }

  if (url.origin !== internalOrigin || !isProtectedPath(url.pathname)) {
    return '/'
  }

  return `${url.pathname}${url.search}`
}

const toLoginPath = (requestedPath: string): string =>
  `/login?next=${encodeURIComponent(resolveNext(requestedPath))}`

export const AuthRedirect = {
  isProtectedPath,
  resolveNext,
  toLoginPath,
} as const
