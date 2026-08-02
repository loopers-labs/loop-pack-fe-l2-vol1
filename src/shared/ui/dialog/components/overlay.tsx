import { createPortal } from 'react-dom';
import { type MouseEvent as ReactMouseEvent } from 'react';
import { useDialogContext } from '../hooks/useDialogContext';

export function Overlay() {
  const { open, setOpen, onOverlayClick, closeOnOutsideInteraction } = useDialogContext();

  if (!open || typeof document === 'undefined') {
    return null;
  }

  const handleOverlayClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    onOverlayClick?.(event);
    if (!closeOnOutsideInteraction) return;
    if (event.defaultPrevented) return;
    setOpen(false);
  };

  return createPortal(
    <div className="dialog-overlay" onClick={handleOverlayClick} />,
    document.body,
    'DIALOG_OVERLAY',
  );
}
