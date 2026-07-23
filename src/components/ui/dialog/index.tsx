"use client";

import type { ButtonHTMLAttributes, HTMLAttributes, MouseEvent, ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Primitive } from "./primitive";
import { composeEventHandlers } from "./slot";

type DialogContextValue = {
  open: boolean;
  titleId: string;
  descriptionId: string;
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
  const baseId = useId();
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const currentOpen = isControlled ? open : internalOpen;
  const titleId = `${baseId}-title`;
  const descriptionId = `${baseId}-description`;

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
    <DialogContext.Provider
      value={{ open: currentOpen, titleId, descriptionId, setOpen, toggleOpen }}
    >
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

  const portalContainer = typeof document === "undefined" ? null : document.body;

  if (!open || portalContainer === null) {
    return null;
  }

  return createPortal(children, portalContainer);
}

function DialogOverlay({ onClick, ...props }: DialogDivProps) {
  const { setOpen } = useDialogContext("Dialog.Overlay");

  return <Primitive.div onClick={composeEventHandlers(onClick, () => setOpen(false))} {...props} />;
}

function DialogContent({
  onClick,
  role,
  "aria-modal": ariaModal,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  ...props
}: DialogDivProps) {
  const { titleId, descriptionId } = useDialogContext("Dialog.Content");

  const stopClickPropagation = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <Primitive.div
      {...props}
      role={role ?? "dialog"}
      aria-modal={ariaModal ?? true}
      aria-labelledby={ariaLabelledBy ?? titleId}
      aria-describedby={ariaDescribedBy ?? descriptionId}
      onClick={composeEventHandlers(stopClickPropagation, onClick)}
    />
  );
}

function DialogTitle({ id, ...props }: DialogTitleProps) {
  const { titleId } = useDialogContext("Dialog.Title");

  return <Primitive.h2 id={id ?? titleId} {...props} />;
}

function DialogDescription({ id, ...props }: DialogDescriptionProps) {
  const { descriptionId } = useDialogContext("Dialog.Description");

  return <Primitive.p id={id ?? descriptionId} {...props} />;
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
