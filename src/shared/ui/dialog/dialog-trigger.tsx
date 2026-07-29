"use client";

import { isValidElement, type ComponentPropsWithoutRef, type ReactElement } from "react";

import { composeEventHandlers } from "../internal/compose-event-handlers";
import { Slot } from "../internal/slot";
import { useDialogContext } from "./dialog-context";

interface DialogTriggerProps extends ComponentPropsWithoutRef<"button"> {
  asChild?: boolean;
}

export function DialogTrigger({
  asChild = false,
  onClick,
  children,
  ...rest
}: DialogTriggerProps): ReactElement {
  const { open, setOpen } = useDialogContext("Trigger");

  const handleClick = composeEventHandlers(onClick, () => setOpen(true));
  const dataState = open ? "open" : "closed";

  if (asChild && isValidElement<Record<string, unknown>>(children)) {
    return (
      <Slot {...rest} data-state={dataState} onClick={handleClick}>
        {children}
      </Slot>
    );
  }

  return (
    <button type="button" {...rest} data-state={dataState} onClick={handleClick}>
      {children}
    </button>
  );
}
