'use client';

// Dialog (Compound) — 4주차 2단계
//
// Compound 조립 + controlled/uncontrolled 이중 API가 핵심.
// 요구사항 (자세한 건 docs/assignments/week-04.md):
//   - compound: Dialog / Dialog.Trigger / Dialog.Overlay / Dialog.Content /
//               Dialog.Title / Dialog.Description / Dialog.Close
//   - controlled(open·onOpenChange)와 uncontrolled 둘 다 지원 (open prop 유무로 판별)
//   - Content/Overlay는 Portal로 렌더
//   - Esc / 오버레이 클릭으로 닫고, 열린 동안 배경 스크롤 잠금
//   - (이번 주 범위 밖) 포커스 트랩·ARIA는 하지 않는다.
//
// 설계 원칙 (Headless):
//   이 컴포넌트는 "동작"만 제공하고 "스타일"은 일체 갖지 않는다.
//   모든 시각적 처리는 사용처가 className/style 등의 DOM props로 주입한다.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { Portal } from './Portal';

interface DialogContextValue {
  isOpen: boolean;
  setOpen: (next: boolean) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

const useDialogContext = (): DialogContextValue => {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error('Dialog 하위 컴포넌트는 <Dialog> 안에서 사용해야 합니다');
  }
  return ctx;
};

interface DialogProps {
  children: ReactNode;
  /** Controlled 모드. 넘기면 부모가 상태를 소유. */
  open?: boolean;
  /** Uncontrolled 모드의 초깃값. open이 있으면 무시됨. */
  defaultOpen?: boolean;
  /** 열리고 닫힐 때마다 호출 (양쪽 모드에서 다 불림) */
  onOpenChange?: (open: boolean) => void;
}

// DialogRoot의 props 구조 및 controlled, uncontrolled 판단 AI로 작성
function DialogRoot({ children, open, defaultOpen, onOpenChange }: DialogProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);

  // open prop이 넘어왔으면 controlled, 아니면 uncontrolled
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      onOpenChange?.(next); // 항상 알림
      if (!isControlled) setInternalOpen(next); // uncontrolled일 때만 내부 갱신
    },
    [isControlled, onOpenChange]
  );

  return <DialogContext.Provider value={{ isOpen, setOpen }}>{children}</DialogContext.Provider>;
}

function Trigger({ children, ...rest }: ComponentProps<'button'>) {
  const { setOpen } = useDialogContext();
  return (
    <button
      type="button"
      {...rest}
      onClick={(e) => {
        rest.onClick?.(e);
        setOpen(true);
      }}
    >
      {children}
    </button>
  );
}

function Overlay({ ...rest }: ComponentProps<'div'>) {
  const { isOpen, setOpen } = useDialogContext();
  if (!isOpen) return null;

  return (
    <Portal>
      <div
        {...rest}
        onClick={(e) => {
          rest.onClick?.(e);
          setOpen(false);
        }}
      />
    </Portal>
  );
}

function Content({ children, ...rest }: ComponentProps<'div'>) {
  const { isOpen, setOpen } = useDialogContext();

  // Esc 키 처리
  // 클릭 이벤트 전파를 막을 필요는 없다. Overlay도 Portal이라 DOM 상에서 형제 관계이므로
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setOpen]);

  // 배경 스크롤 잠금
  // 모달이 열려있는 동안 body의 overflow를 hidden으로 바꾸고,
  // 닫히거나 언마운트 시 원래 값으로 복원한다.
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Portal>
      <div role="dialog" {...rest}>
        {children}
      </div>
    </Portal>
  );
}

function Title({ children, ...rest }: ComponentProps<'h2'>) {
  return <h2 {...rest}>{children}</h2>;
}

function Description({ children, ...rest }: ComponentProps<'p'>) {
  return <p {...rest}>{children}</p>;
}

function Close({ children, ...rest }: ComponentProps<'button'>) {
  const { setOpen } = useDialogContext();
  return (
    <button
      type="button"
      {...rest}
      onClick={(e) => {
        rest.onClick?.(e);
        setOpen(false);
      }}
    >
      {children}
    </button>
  );
}

export const Dialog = Object.assign(DialogRoot, {
  Trigger,
  Overlay,
  Content,
  Title,
  Description,
  Close,
});
