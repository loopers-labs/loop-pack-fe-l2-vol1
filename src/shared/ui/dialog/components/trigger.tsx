'use client';

import { useDialogContext } from '../hooks/useDialogContext';
import { type ReactNode } from 'react';

type TriggerProps = {
  children: ReactNode;
  /** 사용처가 트리거 버튼을 스타일링할 수 있도록 전달 */
  className?: string;
};

export function Trigger({ children, className }: TriggerProps) {
  const { setOpen } = useDialogContext();

  return (
    <button className={className} onClick={() => setOpen(true)}>
      {children}
    </button>
  );
}
