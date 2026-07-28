'use client';

import { type ReactNode, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialogContext } from './context/DialogContext';
import { useBodyScrollLock } from './hooks/useBodyScrollLock';
import { useDialogContext } from './hooks/useDialogContext';
import { useEscClose } from './hooks/useEscClose';

type DialogProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
};

type DialogPartProps = Pick<DialogProps, 'children'>;

/**
 * 루트. 열림 축 하나를 controlled/uncontrolled 겸용으로 관리하고,
 * 열린 동안 Esc 닫기 + 배경 스크롤 잠금을 담당한다.
 */
const DialogRoot = ({ open, defaultOpen, onOpenChange, children }: DialogProps) => {
  const [internalOpen, setInternalOpen] = useState<boolean>(defaultOpen ?? false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const setIsOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);

    if (next !== isOpen) onOpenChange?.(next);
  };

  useBodyScrollLock({ isOpen });

  useEscClose({ isOpen, setIsOpen });

  return <DialogContext.Provider value={{ isOpen, setIsOpen }}>{children}</DialogContext.Provider>;
};

/**
 * 비제어 컴포넌트일 때, 클릭하여 내부상태를 open 상태로 바꾸어 dialog를 노출시킬 수 있도록하는 `Trigger` 컴포넌트입니다.
 */
const Trigger = ({ children }: DialogPartProps) => {
  const { setIsOpen } = useDialogContext();

  return (
    <button type="button" onClick={() => setIsOpen(true)}>
      {children}
    </button>
  );
};

/**
 * dialog 뒤에 깔리는 오버레이 입니다.
 * - portal로 body 태그 하위로 보냅니다.
 */
const Overlay = () => {
  const { isOpen, setIsOpen } = useDialogContext();

  if (!isOpen) return null;

  return createPortal(<div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/50" />, document.body);
};

/**
 * Portal 로 렌더되는 본문. Overlay 와 형제 portal 이므로 내부 클릭이
 * Overlay 로 전파되지 않는다(별도 stopPropagation 불필요).
 */
const Content = ({ children }: DialogPartProps) => {
  const { isOpen } = useDialogContext();

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
      {children}
    </div>,
    document.body,
  );
};

const Title = ({ children }: DialogPartProps) => {
  useDialogContext();

  return <h2>{children}</h2>;
};

const Description = ({ children }: DialogPartProps) => {
  useDialogContext();

  return <p>{children}</p>;
};

const Close = ({ children }: DialogPartProps) => {
  const { setIsOpen } = useDialogContext();

  return (
    <button type="button" onClick={() => setIsOpen(false)}>
      {children}
    </button>
  );
};

export const Dialog = Object.assign(DialogRoot, {
  Trigger,
  Overlay,
  Content,
  Title,
  Description,
  Close,
});
