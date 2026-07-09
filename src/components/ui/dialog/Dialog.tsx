import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

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

export function useDialogContext() {
  const context = useContext(DialogContext);
  if (context === null) {
    throw new Error('Dialog 하위 컴포넌트는 <Dialog> 안에서 사용해야 합니다.');
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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        requestOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentOpen, requestOpenChange]);

  useEffect(() => {
    if (!currentOpen) {
      return;
    }

    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
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
  const { requestOpenChange } = useDialogContext();

  return (
    <button
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
  const { requestOpenChange } = useDialogContext();

  return (
    <button
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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(children, document.body);
}

type DialogOverlayProps = ComponentPropsWithoutRef<'div'>;

export function DialogOverlay({ onClick, ...props }: DialogOverlayProps) {
  const { open, requestOpenChange } = useDialogContext();

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
  const { open } = useDialogContext();

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
