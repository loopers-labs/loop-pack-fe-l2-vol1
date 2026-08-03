import { useEffect } from 'react';

import { DialogContextValue } from '../context/DialogContext';

export const useEscClose = ({ isOpen, setIsOpen }: DialogContextValue) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);
};
