import { createContext } from 'react';

export interface DialogContextValue {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const DialogContext = createContext<DialogContextValue | null>(null);
