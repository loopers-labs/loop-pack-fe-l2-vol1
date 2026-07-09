"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

// ── Context — compound 조각들이 공유하는 상태 ────────────────

interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext(part: string): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error(`<Dialog.${part}>은 <Dialog> 안에서만 사용할 수 있습니다`);
  }
  return ctx;
}

// ── 루트 — controlled / uncontrolled 이중 API ────────────────

interface DialogProps {
  children: ReactNode;
  /** 이 prop이 있으면 controlled 모드: 열림 상태의 주인은 사용처다 */
  open?: boolean;
  /** uncontrolled 모드의 초기 열림 상태 */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Dialog({ children, open, defaultOpen = false, onOpenChange }: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);

  const isControlled = open !== undefined;
  const actualOpen = isControlled ? open : uncontrolledOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      // controlled면 내부 상태를 건드리지 않는다 — 상태 변경은 주인(사용처)의 몫
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const contextValue = useMemo(() => ({ open: actualOpen, setOpen }), [actualOpen, setOpen]);

  return <DialogContext.Provider value={contextValue}>{children}</DialogContext.Provider>;
}

// ── Portal — SSR에는 document가 없으므로 마운트 후에만 붙인다 ──

function Portal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

// ── 조각들 ──────────────────────────────────────────────────

function Trigger({ onClick, ...rest }: ComponentPropsWithoutRef<"button">) {
  const { setOpen } = useDialogContext("Trigger");
  return (
    <button
      type="button"
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        setOpen(true);
      }}
    />
  );
}

function Overlay({ onClick, style, ...rest }: ComponentPropsWithoutRef<"div">) {
  const { open, setOpen } = useDialogContext("Overlay");
  if (!open) return null;
  return (
    <Portal>
      <div
        {...rest}
        onClick={(e) => {
          onClick?.(e);
          setOpen(false);
        }}
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

function Content({ style, ...rest }: ComponentPropsWithoutRef<"div">) {
  const { open, setOpen } = useDialogContext("Content");

  // Esc 닫기 + 배경 스크롤 잠금 — 열려 있는 동안만
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, setOpen]);

  if (!open) return null;
  return (
    <Portal>
      <div
        {...rest}
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

function Title({ style, ...rest }: ComponentPropsWithoutRef<"h2">) {
  return <h2 {...rest} style={{ margin: 0, fontSize: 18, fontWeight: 700, ...style }} />;
}

function Description({ style, ...rest }: ComponentPropsWithoutRef<"p">) {
  return (
    <p
      {...rest}
      style={{ margin: "8px 0 0", fontSize: 14, color: "#5a6675", lineHeight: 1.6, ...style }}
    />
  );
}

function Close({ onClick, ...rest }: ComponentPropsWithoutRef<"button">) {
  const { setOpen } = useDialogContext("Close");
  return (
    <button
      type="button"
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
    />
  );
}

// ── compound 조립 ────────────────────────────────────────────

Dialog.Trigger = Trigger;
Dialog.Overlay = Overlay;
Dialog.Content = Content;
Dialog.Title = Title;
Dialog.Description = Description;
Dialog.Close = Close;
