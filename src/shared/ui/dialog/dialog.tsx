"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext(component: string): DialogContextValue {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error(`Dialog.${component} must be used within <Dialog>`);
  }
  return context;
}

// Content/Overlay는 body에 붙는 Portal이라 서버에는 document가 없다.
// mount 이후에만 렌더해 SSR에서 document 접근으로 throw하지 않게 한다.
function usePortalMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR portal mount 가드: 서버엔 document가 없어 mount 이후 한 번만 켜야 한다(docs/react/component-patterns.md 패턴)
  useEffect(() => setMounted(true), []);
  return mounted;
}

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export function Dialog({ open: controlledOpen, onOpenChange, children }: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(next);
      }
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);

  return <DialogContext.Provider value={{ open, setOpen }}>{children}</DialogContext.Provider>;
}

function Trigger({ children }: { children: ReactNode }) {
  const { open, setOpen } = useDialogContext("Trigger");
  return (
    <button type="button" onClick={() => setOpen(!open)}>
      {children}
    </button>
  );
}

function Close({ children }: { children: ReactNode }) {
  const { setOpen } = useDialogContext("Close");
  return (
    <button type="button" onClick={() => setOpen(false)}>
      {children}
    </button>
  );
}

function Overlay() {
  const { open, setOpen } = useDialogContext("Overlay");
  const mounted = usePortalMounted();

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div
      data-testid="dialog-overlay"
      onClick={() => setOpen(false)}
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 40 }}
    />,
    document.body,
  );
}

function Content({ children }: { children: ReactNode }) {
  const { open } = useDialogContext("Content");
  const mounted = usePortalMounted();

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div
      onClick={(event) => event.stopPropagation()}
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 50,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

function Title({ children }: { children: ReactNode }) {
  useDialogContext("Title");
  return <h2>{children}</h2>;
}

function Description({ children }: { children: ReactNode }) {
  useDialogContext("Description");
  return <p>{children}</p>;
}

Dialog.Trigger = Trigger;
Dialog.Overlay = Overlay;
Dialog.Content = Content;
Dialog.Title = Title;
Dialog.Description = Description;
Dialog.Close = Close;
