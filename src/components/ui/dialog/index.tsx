"use client";

import type { ButtonHTMLAttributes, HTMLAttributes, MouseEvent, ReactNode } from "react";
import { createContext, useContext, useState } from "react";
import { createPortal } from "react-dom";

type DialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
};

type DialogRootProps = {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type DialogButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;
type DialogPortalProps = {
  children: ReactNode;
};
type DialogDivProps = HTMLAttributes<HTMLDivElement>;

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext(componentName: string) {
  const context = useContext(DialogContext);

  if (context === null) {
    throw new Error(`${componentName} must be used within Dialog.Root`);
  }

  return context;
}

function DialogRoot({ children, open, defaultOpen = false, onOpenChange }: DialogRootProps) {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const currentOpen = isControlled ? open : internalOpen;

  const setOpen = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);
  };

  const toggleOpen = () => {
    setOpen(!currentOpen);
  };

  return (
    <DialogContext.Provider value={{ open: currentOpen, setOpen, toggleOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

function DialogTrigger({ onClick, type = "button", ...props }: DialogButtonProps) {
  const { toggleOpen } = useDialogContext("Dialog.Trigger");

  return (
    <button
      type={type}
      onClick={(event) => {
        onClick?.(event);

        if (event.defaultPrevented) {
          return;
        }

        toggleOpen();
      }}
      {...props}
    />
  );
}

function DialogClose({ onClick, type = "button", ...props }: DialogButtonProps) {
  const { setOpen } = useDialogContext("Dialog.Close");

  return (
    <button
      type={type}
      onClick={(event) => {
        onClick?.(event);

        if (event.defaultPrevented) {
          return;
        }

        setOpen(false);
      }}
      {...props}
    />
  );
}

function DialogPortal({ children }: DialogPortalProps) {
  const { open } = useDialogContext("Dialog.Portal");

  if (!open) {
    return null;
  }

  return createPortal(children, document.body);
}

function DialogOverlay(props: DialogDivProps) {
  return <div {...props} />;
}

function DialogContent({ onClick, ...props }: DialogDivProps) {
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    onClick?.(event);
  };

  return <div onClick={handleClick} {...props} />;
}

export const Dialog = {
  Root: DialogRoot,
  Trigger: DialogTrigger,
  Portal: DialogPortal,
  Overlay: DialogOverlay,
  Content: DialogContent,
  Close: DialogClose,
};
