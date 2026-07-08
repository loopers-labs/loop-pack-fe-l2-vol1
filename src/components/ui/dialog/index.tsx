'use client';

import {
  type ReactNode,
  type MouseEvent,
  useState,
  useEffect,
  useCallback,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import { DialogContext, useDialogContext } from './_contexts/dialogContext';

// ── Root ──

type DialogProps = {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function Dialog({ children, open, onOpenChange }: DialogProps) {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);

  const isOpen = isControlled ? open : internalOpen;

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  return (
    <DialogContext value={{ isOpen, onOpenChange: handleOpenChange }}>
      {children}
    </DialogContext>
  );
}

// ── Trigger ──

type TriggerProps = {
  children: ReactNode;
  asChild?: boolean;
};

function DialogTrigger({ children }: TriggerProps) {
  const { onOpenChange } = useDialogContext();

  return (
    <button type="button" onClick={() => onOpenChange(true)}>
      {children}
    </button>
  );
}

// ── Portal wrapper ──

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

function Portal({ children }: { children: ReactNode }) {
  const isMounted = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (!isMounted) return null;
  return createPortal(children, document.body);
}

// ── Overlay ──

type OverlayProps = {
  className?: string;
};

function DialogOverlay({ className }: OverlayProps) {
  const { isOpen, onOpenChange } = useDialogContext();

  if (!isOpen) return null;

  return (
    <Portal>
      <div
        className={className}
        style={
          !className
            ? {
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                zIndex: 50,
              }
            : undefined
        }
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
    </Portal>
  );
}

// ── Content ──

type ContentProps = {
  children: ReactNode;
  className?: string;
};

function DialogContent({ children, className }: ContentProps) {
  const { isOpen, onOpenChange } = useDialogContext();

  // Esc 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onOpenChange]);

  // 스크롤 잠금
  useEffect(() => {
    if (!isOpen) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Portal>
      <div
        role="dialog"
        aria-modal="true"
        className={className}
        style={
          !className
            ? {
                position: 'fixed',
                inset: 0,
                zIndex: 51,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }
            : undefined
        }
      >
        <div
          style={{ pointerEvents: 'auto' }}
          onClick={(e: MouseEvent) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </Portal>
  );
}

// ── Title ──

function DialogTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <h2 className={className}>{children}</h2>;
}

// ── Description ──

function DialogDescription({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={className}>{children}</p>;
}

// ── Close ──

function DialogClose({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { onOpenChange } = useDialogContext();

  return (
    <button
      type="button"
      className={className}
      onClick={() => onOpenChange(false)}
    >
      {children}
    </button>
  );
}

// ── Compound 조립 ──

Dialog.Trigger = DialogTrigger;
Dialog.Overlay = DialogOverlay;
Dialog.Content = DialogContent;
Dialog.Title = DialogTitle;
Dialog.Description = DialogDescription;
Dialog.Close = DialogClose;

export { Dialog };
