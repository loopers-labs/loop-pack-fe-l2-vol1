import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
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

  return (
    <DialogContext.Provider value={{ open: currentOpen, requestOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

interface DialogTriggerProps {
  children: ReactNode;
}

export function DialogTrigger({ children }: DialogTriggerProps) {
  const { requestOpenChange } = useDialogContext();

  return <button onClick={() => requestOpenChange(true)}>{children}</button>;
}

interface DialogCloseProps {
  children: ReactNode;
}

export function DialogClose({ children }: DialogCloseProps) {
  const { requestOpenChange } = useDialogContext();

  return <button onClick={() => requestOpenChange(false)}>{children}</button>;
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

interface DialogOverlayProps {
  children?: ReactNode;
}

export function DialogOverlay({ children }: DialogOverlayProps) {
  const { open, requestOpenChange } = useDialogContext();

  if (!open) {
    return null;
  }

  return (
    <DialogPortal>
      <div onClick={() => requestOpenChange(false)}>{children}</div>
    </DialogPortal>
  );
}

interface DialogContentProps {
  children: ReactNode;
}

export function DialogContent({ children }: DialogContentProps) {
  const { open } = useDialogContext();

  if (!open) {
    return null;
  }

  return (
    <DialogPortal>
      <div>{children}</div>
    </DialogPortal>
  );
}

export const Dialog = Object.assign(DialogRoot, {
  Trigger: DialogTrigger,
  Close: DialogClose,
  Overlay: DialogOverlay,
  Content: DialogContent,
});
