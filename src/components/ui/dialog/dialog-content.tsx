"use client";

import type { ComponentPropsWithoutRef, ReactElement } from "react";

import { Portal } from "../internal/portal";
import { useEscapeKey } from "../internal/use-escape-key";
import { useScrollLock } from "../internal/use-scroll-lock";
import { useDialogContext } from "./dialog-context";

export function DialogContent({
  style,
  ...rest
}: ComponentPropsWithoutRef<"div">): ReactElement | null {
  const { open, setOpen } = useDialogContext("Content");

  useEscapeKey(() => setOpen(false), open);
  useScrollLock(open);

  if (!open) return null;
  return (
    <Portal>
      <div
        {...rest}
        data-state="open"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 51,
          minWidth: 320,
          maxWidth: "calc(100vw - 48px)",
          padding: 24,
          borderRadius: 16,
          background: "#fff",
          boxShadow: "0 16px 48px rgba(0, 0, 0, 0.2)",
          ...style,
        }}
      />
    </Portal>
  );
}
