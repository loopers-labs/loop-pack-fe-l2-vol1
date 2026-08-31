import type { CartOwnerKey } from './cartOwner';

export interface CartItem {
  id: string;
  quantity: number;
}

export interface CartState {
  ownerKey: CartOwnerKey;
  items: Map<string, CartItem>;
  lastAddedId: string | null;
  isHydrated: boolean;
  addItem: (id: string) => void;
  removeItem: (id: string) => void;
  clearItems: () => void;
  clearLastAdded: () => void;
  setHydrated: () => void;
}
