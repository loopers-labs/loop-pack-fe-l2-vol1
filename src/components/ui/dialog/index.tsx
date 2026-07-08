"use client";

import type { ButtonHTMLAttributes, HTMLAttributes, MouseEvent, ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
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
type DialogTitleProps = HTMLAttributes<HTMLHeadingElement>;
type DialogDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

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

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange],
  );

  const toggleOpen = useCallback(() => {
    setOpen(!currentOpen);
  }, [currentOpen, setOpen]);

  useEffect(() => {
    if (!currentOpen) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const computedBodyPaddingRight = window.getComputedStyle(document.body).paddingRight;
    const bodyPaddingRightValue = Number.parseFloat(computedBodyPaddingRight) || 0;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${bodyPaddingRightValue + scrollbarWidth}px`;
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.paddingRight = previousBodyPaddingRight;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentOpen, setOpen]);

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

function DialogOverlay({ onClick, ...props }: DialogDivProps) {
  const { setOpen } = useDialogContext("Dialog.Overlay");

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    onClick?.(event);

    if (event.defaultPrevented) {
      return;
    }

    setOpen(false);
  };

  return <div onClick={handleClick} {...props} />;
}

function DialogContent({ onClick, ...props }: DialogDivProps) {
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    onClick?.(event);
  };

  return <div onClick={handleClick} {...props} />;
}

function DialogTitle(props: DialogTitleProps) {
  useDialogContext("Dialog.Title");

  return <h2 {...props} />;
}

function DialogDescription(props: DialogDescriptionProps) {
  useDialogContext("Dialog.Description");

  return <p {...props} />;
}

export const Dialog = {
  Root: DialogRoot,
  Trigger: DialogTrigger,
  Portal: DialogPortal,
  Overlay: DialogOverlay,
  Content: DialogContent,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
};
