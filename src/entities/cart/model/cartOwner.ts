export const GUEST_CART_OWNER = 'guest' as const;

export type CartOwnerKey =
  | typeof GUEST_CART_OWNER
  | `user:${string}`;

export const LEGACY_CART_STORAGE_KEY = 'aesthetic-cart';

export function getCartOwnerKey(userId?: string | null): CartOwnerKey {
  const normalizedUserId = userId?.trim();
  if (!normalizedUserId) return GUEST_CART_OWNER;

  return `user:${encodeURIComponent(normalizedUserId)}`;
}

export function getCartStorageKey(ownerKey: CartOwnerKey): string {
  return `aesthetic-cart:${ownerKey}`;
}
