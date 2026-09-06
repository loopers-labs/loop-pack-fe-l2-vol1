import { isCartOwnerKey } from './cartOwner';
import type { CartOwnerKey } from './cartOwner';

export function shouldReloadForCartOwnerChange(
  currentOwnerKey: CartOwnerKey,
  nextOwnerValue: string | null,
): boolean {
  return isCartOwnerKey(nextOwnerValue) && nextOwnerValue !== currentOwnerKey;
}

export function reloadCurrentPage(): void {
  window.location.reload();
}
