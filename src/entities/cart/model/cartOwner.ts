export const GUEST_CART_OWNER = 'guest' as const;

export type CartOwnerKey =
  | typeof GUEST_CART_OWNER
  | `user:${string}`;

export const LEGACY_CART_STORAGE_KEY = 'aesthetic-cart';
export const CART_ACTIVE_OWNER_STORAGE_KEY = 'aesthetic-cart:active-owner';

export function isCartOwnerKey(value: unknown): value is CartOwnerKey {
  return (
    value === GUEST_CART_OWNER ||
    (typeof value === 'string' &&
      value.startsWith('user:') &&
      value.length > 'user:'.length)
  );
}

export function getCartOwnerKey(userId?: string | null): CartOwnerKey {
  const normalizedUserId = userId?.trim();
  if (!normalizedUserId) return GUEST_CART_OWNER;

  return `user:${encodeURIComponent(normalizedUserId)}`;
}

export function getCartStorageKey(ownerKey: CartOwnerKey): string {
  return `aesthetic-cart:${ownerKey}`;
}
