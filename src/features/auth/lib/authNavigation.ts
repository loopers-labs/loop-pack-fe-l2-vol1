import { replaceDocumentLocation } from '@/shared/lib/browserNavigation';
import {
  getLoginEntrySourceFromPathname,
  type LoginEntrySource,
} from '@/shared/lib/loginEntrySource';
import { getSafeReturnTo } from '@/shared/lib/safeReturnTo';

export const LOGIN_SOURCE_SEARCH_PARAM = 'loginSource';

export type LoginSourceSearchParams = {
  [LOGIN_SOURCE_SEARCH_PARAM]?: string;
};

export function createLoginSourceHref(
  href: string,
  loginSource: LoginEntrySource,
): string {
  const safeHref = getSafeReturnTo(href);
  if (loginSource === 'direct') return safeHref;

  const url = new URL(safeHref, 'http://localhost');
  url.searchParams.set(LOGIN_SOURCE_SEARCH_PARAM, loginSource);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function createLoginHref(
  returnTo: string,
  loginSource: LoginEntrySource = 'direct',
): string {
  const searchParams = new URLSearchParams({
    returnTo: getSafeReturnTo(returnTo),
  });
  return createLoginSourceHref(
    `/login?${searchParams.toString()}`,
    loginSource,
  );
}

export function redirectToLogin(): void {
  if (typeof window === 'undefined') return;

  const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const loginSource = getLoginEntrySourceFromPathname(
    window.location.pathname,
  );
  replaceDocumentLocation(createLoginHref(returnTo, loginSource));
}
