"use client";

import type { ComponentPropsWithoutRef, ReactElement } from "react";

import { composeEventHandlers } from "../internal/compose-event-handlers";
import { Portal } from "../internal/portal";
import { useDialogContext } from "./dialog-context";

export function DialogOverlay({
  onClick,
  style,
  ...rest
}: ComponentPropsWithoutRef<"div">): ReactElement | null {
  const { open, setOpen } = useDialogContext("Overlay");

  if (!open) return null;
  return (
    <Portal>
      <div
        {...rest}
        data-state="open"
        onClick={composeEventHandlers(onClick, () => setOpen(false))}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.5)",
          zIndex: 50,
          ...style,
        }}
      />
    </Portal>
  );
}
