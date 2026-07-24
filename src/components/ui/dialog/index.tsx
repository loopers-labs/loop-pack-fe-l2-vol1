// Dialog (Compound) — 4주차 2단계
//
// 여기에 직접 만든다. compound 조립과 controlled/uncontrolled 이중 API가 알맹이다.
// 요구사항 요약 (자세한 건 docs/assignments/week-04.md):
//   - compound: Dialog / Dialog.Trigger / Dialog.Overlay / Dialog.Content /
//               Dialog.Title / Dialog.Description / Dialog.Close
//   - controlled(open·onOpenChange)와 uncontrolled 둘 다 지원 (open prop 유무로 판별)
//   - Content/Overlay는 Portal로 렌더
//   - Esc / 오버레이 클릭으로 닫고, 열린 동안 배경 스크롤 잠금
//   - (이번 주 범위 밖) 포커스 트랩·ARIA는 하지 않는다. compound + 이중 API에 집중.
"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

// 조각들이 공유하는 단 하나의 사실: "지금 열렸나?" + "바꾸는 법".
// prop을 조각마다 넘기는 대신 Context로 공유한다(= compound 조립의 뼈대).
type DialogContextValue = { open: boolean; setOpen: (open: boolean) => void };
const DialogContext = createContext<DialogContextValue | null>(null);

// 조각은 <Dialog> 밖에서 쓰면 계약 위반 — null 가드로 좁혀서(타입 가드) as 없이 non-null 확보.
function useDialogContext() {
  const ctx = useContext(DialogContext);
  if (ctx === null) {
    throw new Error("Dialog.* 조각은 <Dialog> 안에서만 쓸 수 있다.");
  }
  return ctx;
}

// SSR-안전 클라이언트 감지. mounted 플래그를 effect로 세우면 set-state-in-effect에
// 걸리므로, React 권장 primitive인 useSyncExternalStore로 서버/클라 스냅샷을 나눈다.
// (Portal은 document가 필요한데 서버엔 없으니, 클라에서만 렌더해야 한다.)
const subscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

// 이중 API의 핵심: open prop이 넘어오면(controlled) 그 값을 진실로 쓰고, 없으면
// (uncontrolled) 내부 state를 진실로 쓴다. 어느 쪽이든 setOpen은 onOpenChange로
// 바깥에 "바꾸고 싶다"를 알리되, controlled일 땐 내부 state를 건드리지 않는다
// (진실의 주인이 바깥이므로).
function useControllableOpen({
  open,
  defaultOpen,
  onOpenChange,
}: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isControlled = open !== undefined;
  const [uncontrolled, setUncontrolled] = useState(defaultOpen ?? false);
  const value = open ?? uncontrolled;
  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setUncontrolled(next);
      }
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );
  return { open: value, setOpen };
}

function DialogRoot({
  open,
  defaultOpen,
  onOpenChange,
  children,
}: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const { open: isOpen, setOpen } = useControllableOpen({ open, defaultOpen, onOpenChange });

  // Esc 닫기 + 배경 스크롤 잠금: document(외부 시스템) 동기화라 effect가 맞는 도구.
  // 열려 있을 때만 리스너/잠금을 걸고, cleanup에서 원복한다.
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, setOpen]);

  const value = useMemo(() => ({ open: isOpen, setOpen }), [isOpen, setOpen]);
  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
}

function DialogTrigger({ children }: { children: React.ReactNode }) {
  const { setOpen } = useDialogContext();
  return (
    <button type="button" onClick={() => setOpen(true)}>
      {children}
    </button>
  );
}

function DialogClose({ children }: { children: React.ReactNode }) {
  const { setOpen } = useDialogContext();
  return (
    <button type="button" onClick={() => setOpen(false)}>
      {children}
    </button>
  );
}

function DialogOverlay() {
  const { open, setOpen } = useDialogContext();
  const isClient = useIsClient();
  if (!open || !isClient) {
    return null;
  }
  // 오버레이(배경)와 Content는 형제 Portal이라, 배경 클릭만 닫고 Content 클릭은
  // 배경에 닿지 않는다 → stopPropagation 없이도 "바깥 클릭 닫기"가 성립한다.
  return createPortal(
    <div
      onClick={() => setOpen(false)}
      style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.4)" }}
    />,
    document.body,
  );
}

function DialogContent({ children }: { children: React.ReactNode }) {
  const { open } = useDialogContext();
  const isClient = useIsClient();
  if (!open || !isClient) {
    return null;
  }
  return createPortal(
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        minWidth: 280,
        padding: 24,
        background: "#fff",
        borderRadius: 8,
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 style={{ margin: "0 0 8px" }}>{children}</h2>;
}

function DialogDescription({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: "0 0 16px", color: "#555" }}>{children}</p>;
}

// compound 조립: 루트 함수에 조각들을 property로 붙여 Dialog.Trigger 형태로 노출.
export const Dialog = Object.assign(DialogRoot, {
  Trigger: DialogTrigger,
  Overlay: DialogOverlay,
  Content: DialogContent,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
});
