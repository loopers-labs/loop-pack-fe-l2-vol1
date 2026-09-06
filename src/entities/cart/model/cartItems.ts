import type { CartItem } from './cartTypes';

export function mergeCartItems(
  currentItems: ReadonlyMap<string, CartItem>,
  incomingItems: Iterable<CartItem>,
): Map<string, CartItem> {
  const mergedItems = new Map(currentItems);

  for (const item of incomingItems) {
    if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) continue;

    const currentQuantity = mergedItems.get(item.id)?.quantity ?? 0;
    const quantity = Math.min(
      Number.MAX_SAFE_INTEGER,
      currentQuantity + item.quantity,
    );

    mergedItems.set(item.id, { id: item.id, quantity });
  }

  return mergedItems;
}
