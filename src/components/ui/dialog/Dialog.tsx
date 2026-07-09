import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

import { isTopDialog, popDialog, pushDialog } from './dialogStack';
import { lockScroll, unlockScroll } from './scrollLock';

import { useIsomorphicLayoutEffect } from '@/shared/useIsomorphicLayoutEffect';

interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

interface DialogContextValue {
  open: boolean;
  requestOpenChange: (nextOpen: boolean) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialogContext(componentName: string) {
  const context = useContext(DialogContext);
  if (context === null) {
    throw new Error(`${componentName}는 <Dialog> 안에서 사용해야 합니다.`);
  }

  return context;
}

function DialogRoot({
  open,
  defaultOpen = false,
  onOpenChange,
  children,
}: DialogProps) {
  const isControlled = open !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);

  const dialogToken = useRef(Symbol('Dialog')).current;

  const currentOpen = isControlled ? open : uncontrolledOpen;

  const requestOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange],
  );

  useEffect(() => {
    if (!currentOpen) {
      return;
    }

    pushDialog(dialogToken);

    return () => {
      popDialog(dialogToken);
    };
  }, [currentOpen, dialogToken]);

  useEffect(() => {
    if (!currentOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isTopDialog(dialogToken)) {
        requestOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentOpen, requestOpenChange, dialogToken]);

  useEffect(() => {
    if (!currentOpen) {
      return;
    }

    lockScroll();

    return () => {
      unlockScroll();
    };
  }, [currentOpen]);

  return (
    <DialogContext.Provider value={{ open: currentOpen, requestOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

type DialogTriggerProps = ComponentPropsWithoutRef<'button'>;

export function DialogTrigger({ onClick, ...props }: DialogTriggerProps) {
  const { requestOpenChange } = useDialogContext('Dialog.Trigger');

  return (
    <button
      type="button"
      {...props}
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented) {
          requestOpenChange(true);
        }
      }}
    />
  );
}

type DialogCloseProps = ComponentPropsWithoutRef<'button'>;

export function DialogClose({ onClick, ...props }: DialogCloseProps) {
  const { requestOpenChange } = useDialogContext('Dialog.Close');

  return (
    <button
      type="button"
      {...props}
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented) {
          requestOpenChange(false);
        }
      }}
    />
  );
}

interface DialogPortalProps {
  children: ReactNode;
}

function DialogPortal({ children }: DialogPortalProps) {
  const [mounted, setMounted] = useState(false);

  // Portal은 열릴 때마다 마운트되므로 mounted 전환이 paint 전에 끝나야 빈 프레임이 안 보인다
  useIsomorphicLayoutEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(children, document.body);
}

type DialogOverlayProps = ComponentPropsWithoutRef<'div'>;

export function DialogOverlay({ onClick, ...props }: DialogOverlayProps) {
  const { open, requestOpenChange } = useDialogContext('Dialog.Overlay');

  if (!open) {
    return null;
  }

  return (
    <DialogPortal>
      <div
        {...props}
        onClick={(event) => {
          onClick?.(event);

          if (!event.defaultPrevented) {
            requestOpenChange(false);
          }
        }}
      />
    </DialogPortal>
  );
}

type DialogContentProps = ComponentPropsWithoutRef<'div'>;

export function DialogContent(props: DialogContentProps) {
  const { open } = useDialogContext('Dialog.Content');

  if (!open) {
    return null;
  }

  return (
    <DialogPortal>
      <div {...props} />
    </DialogPortal>
  );
}

type DialogTitleProps = ComponentPropsWithoutRef<'h2'>;

export function DialogTitle(props: DialogTitleProps) {
  return <h2 {...props} />;
}

type DialogDescriptionProps = ComponentPropsWithoutRef<'p'>;

export function DialogDescription(props: DialogDescriptionProps) {
  return <p {...props} />;
}

export const Dialog = Object.assign(DialogRoot, {
  Trigger: DialogTrigger,
  Overlay: DialogOverlay,
  Content: DialogContent,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
});
