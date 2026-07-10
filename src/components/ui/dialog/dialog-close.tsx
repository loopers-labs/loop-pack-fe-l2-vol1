"use client";

import { isValidElement, type ComponentPropsWithoutRef, type ReactElement } from "react";

import { composeEventHandlers } from "../internal/compose-event-handlers";
import { Slot } from "../internal/slot";
import { useDialogContext } from "./dialog-context";

interface DialogCloseProps extends ComponentPropsWithoutRef<"button"> {
  asChild?: boolean;
}

export function DialogClose({
  asChild = false,
  onClick,
  children,
  ...rest
}: DialogCloseProps): ReactElement {
  const { setOpen } = useDialogContext("Close");

  const handleClick = composeEventHandlers(onClick, () => setOpen(false));

  if (asChild && isValidElement<Record<string, unknown>>(children)) {
    return (
      <Slot {...rest} onClick={handleClick}>
        {children}
      </Slot>
    );
  }

  return (
    <button type="button" {...rest} onClick={handleClick}>
      {children}
    </button>
  );
}
