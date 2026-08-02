import { createContext } from 'react';
import type { useSelectRoot } from '../hooks/useSelectRoot';

export type SelectContextValue = ReturnType<typeof useSelectRoot>;

export const SelectContext = createContext<SelectContextValue | null>(null);
