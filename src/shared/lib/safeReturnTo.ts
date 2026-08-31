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

export function createLoginHref(returnTo: string): string {
  const searchParams = new URLSearchParams({
    returnTo: getSafeReturnTo(returnTo),
  });

  return `/login?${searchParams.toString()}`;
}

export function redirectToLogin(): void {
  if (typeof window === 'undefined') return;

  const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.replace(createLoginHref(returnTo));
}
