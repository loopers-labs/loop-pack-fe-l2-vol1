export const LOGIN_FROM_VALUES = ['cart', 'orders', 'direct'] as const;

export type LoginFrom = (typeof LOGIN_FROM_VALUES)[number];

export function getLoginFrom(value: string | null | undefined): LoginFrom {
  return value === 'cart' || value === 'orders' ? value : 'direct';
}

export function getLoginFromPathname(pathname: string): LoginFrom {
  if (pathname === '/cart') return 'cart';
  if (pathname === '/orders' || pathname.startsWith('/orders/')) {
    return 'orders';
  }
  return 'direct';
}
