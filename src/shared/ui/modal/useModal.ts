import { createContext, useContext } from 'react';

interface ModalContextType {
  open: () => void;
  close: () => void;
  opened: boolean;
}

export const ModalContext = createContext<ModalContextType | null>(null);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
};
