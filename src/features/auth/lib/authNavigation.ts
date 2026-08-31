import { replaceDocumentLocation } from '@/shared/lib/browserNavigation';
import { getSafeReturnTo } from '@/shared/lib/safeReturnTo';

export function createLoginHref(returnTo: string): string {
  const searchParams = new URLSearchParams({
    returnTo: getSafeReturnTo(returnTo),
  });

  return `/login?${searchParams.toString()}`;
}

export function redirectToLogin(): void {
  if (typeof window === 'undefined') return;

  const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  replaceDocumentLocation(createLoginHref(returnTo));
}
