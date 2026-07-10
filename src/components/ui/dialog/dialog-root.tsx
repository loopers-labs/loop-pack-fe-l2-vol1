"use client";

import { useMemo, type ReactElement, type ReactNode } from "react";

import { useControllableState } from "../internal/use-controllable-state";
import { DialogContext, type DialogContextValue } from "./dialog-context";

export interface DialogRootProps {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DialogRoot({
  children,
  open,
  defaultOpen = false,
  onOpenChange,
}: DialogRootProps): ReactElement {
  const [actualOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  const contextValue = useMemo<DialogContextValue>(
    () => ({ open: actualOpen, setOpen }),
    [actualOpen, setOpen],
  );

  return <DialogContext value={contextValue}>{children}</DialogContext>;
}
