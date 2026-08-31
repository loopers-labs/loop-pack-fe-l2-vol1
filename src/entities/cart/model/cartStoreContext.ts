import { createContext } from 'react';
import type { CartStore } from './cartStore';

export const CartStoreContext = createContext<CartStore | null>(null);
