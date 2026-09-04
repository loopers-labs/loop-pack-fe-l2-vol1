const INTERNAL_ORIGIN = 'http://internal.invalid'
const HOME_PATH = '/'

export function getSafeReturnPath(value: string | null | undefined): string {
  if (
    value === null ||
    value === undefined ||
    !value.startsWith('/') ||
    value.startsWith('//')
  ) {
    return HOME_PATH
  }

  try {
    const url = new URL(value, INTERNAL_ORIGIN)

    if (url.origin !== INTERNAL_ORIGIN) {
      return HOME_PATH
    }

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return HOME_PATH
  }
}
