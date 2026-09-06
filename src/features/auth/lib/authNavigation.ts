import { replaceDocumentLocation } from '@/shared/lib/browserNavigation';
import {
  getLoginFromPathname,
  type LoginFrom,
} from '@/shared/lib/loginFrom';
import { getSafeReturnTo } from '@/shared/lib/safeReturnTo';

export function createLoginHref(
  returnTo: string,
  loginFrom: LoginFrom = 'direct',
): string {
  const searchParams = new URLSearchParams({
    returnTo: getSafeReturnTo(returnTo),
  });
  if (loginFrom !== 'direct') {
    searchParams.set('from', loginFrom);
  }

  return `/login?${searchParams.toString()}`;
}

export function redirectToLogin(): void {
  if (typeof window === 'undefined') return;

  const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const loginFrom = getLoginFromPathname(window.location.pathname);
  replaceDocumentLocation(createLoginHref(returnTo, loginFrom));
}
