"use client";

import type { ButtonHTMLAttributes, HTMLAttributes, MouseEvent, ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Primitive } from "./primitive";
import { composeEventHandlers } from "./slot";

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

type DialogButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
};
type DialogPortalProps = {
  children: ReactNode;
};
type DialogDivProps = HTMLAttributes<HTMLDivElement> & {
  asChild?: boolean;
};
type DialogTitleProps = HTMLAttributes<HTMLHeadingElement> & {
  asChild?: boolean;
};
type DialogDescriptionProps = HTMLAttributes<HTMLParagraphElement> & {
  asChild?: boolean;
};

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

function DialogTrigger({ asChild, onClick, type = "button", ...props }: DialogButtonProps) {
  const { toggleOpen } = useDialogContext("Dialog.Trigger");

  return (
    <Primitive.button
      asChild={asChild}
      type={asChild ? undefined : type}
      onClick={composeEventHandlers(onClick, toggleOpen)}
      {...props}
    />
  );
}

function DialogClose({ asChild, onClick, type = "button", ...props }: DialogButtonProps) {
  const { setOpen } = useDialogContext("Dialog.Close");

  return (
    <Primitive.button
      asChild={asChild}
      type={asChild ? undefined : type}
      onClick={composeEventHandlers(onClick, () => setOpen(false))}
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

  return <Primitive.div onClick={composeEventHandlers(onClick, () => setOpen(false))} {...props} />;
}

function DialogContent({ onClick, ...props }: DialogDivProps) {
  const stopClickPropagation = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return <Primitive.div onClick={composeEventHandlers(stopClickPropagation, onClick)} {...props} />;
}

function DialogTitle(props: DialogTitleProps) {
  useDialogContext("Dialog.Title");

  return <Primitive.h2 {...props} />;
}

function DialogDescription(props: DialogDescriptionProps) {
  useDialogContext("Dialog.Description");

  return <Primitive.p {...props} />;
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
