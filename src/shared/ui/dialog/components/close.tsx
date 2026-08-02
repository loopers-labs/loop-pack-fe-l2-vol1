import { useDialogContext } from '../hooks/useDialogContext';
import { type ReactNode } from 'react';

type CloseProps = {
  children: ReactNode;
};

export function Close({ children }: CloseProps) {
  const { setOpen } = useDialogContext();

  return (
    <div className="dialog-actions">
      <button onClick={() => setOpen(false)}>{children}</button>
    </div>
  );
}
