const INTERNAL_ORIGIN = 'https://aesthetic.internal';

export function getSafeReturnTo(
  value: string | null | undefined,
  fallback = '/',
): string {
  if (!value) return fallback;

  const candidate = value.trim();
  if (!candidate.startsWith('/') || candidate.startsWith('//')) {
    return fallback;
  }

  try {
    const url = new URL(candidate, INTERNAL_ORIGIN);
    if (url.origin !== INTERNAL_ORIGIN) return fallback;

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
