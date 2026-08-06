'use client';

// Dialog (Compound) — 4주차 2단계
//
// 알맹이 = controlled/uncontrolled 이중 API. `open` prop 유무로 소유자를 판별한다.
// compound 조립: Dialog / .Trigger / .Overlay / .Content / .Title / .Description / .Close
// 조각들은 Context로 { open, setOpen }를 공유한다. Overlay/Content는 Portal로 body에 렌더.
// (범위 밖: 포커스 트랩·복원·ARIA. compound 조립 + 이중 API에 집중.)

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { createPortal } from 'react-dom';

type DialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (ctx === null) {
    throw new Error('Dialog.* 조각은 <Dialog> 안에서만 쓸 수 있습니다.');
  }
  return ctx;
}

type DialogProps = {
  open?: boolean; // 주면 controlled(부모가 상태 소유)
  defaultOpen?: boolean; // 안 주면 uncontrolled의 초기값
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
};

function DialogRoot({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  children,
}: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);

  // 이중 API의 판별점: open prop이 있으면 부모가, 없으면 이 컴포넌트가 상태의 주인.
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next); // 비제어일 때만 내부 상태 갱신
      onOpenChange?.(next); // 어느 쪽이든 부모에 알림 (상태 두 개로 갈라지지 않게)
    },
    [isControlled, onOpenChange],
  );

  // 열려 있는 동안: 배경 스크롤 잠금 + Esc로 닫기. 닫히거나 언마운트되면 원복.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, setOpen]);

  const value = useMemo(() => ({ open, setOpen }), [open, setOpen]);

  return (
    <DialogContext.Provider value={value}>{children}</DialogContext.Provider>
  );
}

// createPortal은 브라우저에서만 — 마운트 뒤에 body로 렌더(SSR 안전).
function Portal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? createPortal(children, document.body) : null;
}

function Trigger({ onClick, ...props }: ComponentProps<'button'>) {
  const { setOpen } = useDialogContext();
  return (
    <button
      type="button"
      {...props}
      onClick={(event) => {
        onClick?.(event);
        setOpen(true);
      }}
    />
  );
}

function Overlay({ onClick, style, ...props }: ComponentProps<'div'>) {
  const { open, setOpen } = useDialogContext();
  if (!open) return null;
  return (
    <Portal>
      <div
        {...props}
        onClick={(event) => {
          onClick?.(event);
          setOpen(false); // 오버레이(배경) 클릭 = 닫기
        }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(17, 24, 39, 0.5)',
          zIndex: 1000,
          ...style,
        }}
      />
    </Portal>
  );
}

function Content({ onClick, style, ...props }: ComponentProps<'div'>) {
  const { open } = useDialogContext();
  if (!open) return null;
  return (
    <Portal>
      <div
        {...props}
        onClick={(event) => {
          event.stopPropagation(); // 내용 클릭은 닫기로 이어지지 않게
          onClick?.(event);
        }}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1001,
          maxWidth: 'calc(100vw - 32px)',
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
          ...style,
        }}
      />
    </Portal>
  );
}

function Title(props: ComponentProps<'h2'>) {
  return <h2 {...props} />;
}

function Description(props: ComponentProps<'p'>) {
  return <p {...props} />;
}

function Close({ onClick, ...props }: ComponentProps<'button'>) {
  const { setOpen } = useDialogContext();
  return (
    <button
      type="button"
      {...props}
      onClick={(event) => {
        onClick?.(event);
        setOpen(false);
      }}
    />
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

export type { DialogProps };
