export const LOGIN_ENTRY_SOURCES = ['cart', 'orders', 'direct'] as const;

export type LoginEntrySource = (typeof LOGIN_ENTRY_SOURCES)[number];

export function getLoginEntrySource(
  value: string | null | undefined,
): LoginEntrySource {
  return value === 'cart' || value === 'orders' ? value : 'direct';
}

export function getLoginEntrySourceFromPathname(
  pathname: string,
): LoginEntrySource {
  if (pathname === '/cart') return 'cart';
  if (pathname === '/orders' || pathname.startsWith('/orders/')) {
    return 'orders';
  }
  return 'direct';
}
