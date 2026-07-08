'use client';

import { createContext, useContext } from 'react';

type DialogContextValue = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialogContext() {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error('Dialog 하위 컴포넌트는 <Dialog> 안에서 사용해야 합니다.');
  }
  return ctx;
}

export { DialogContext };
