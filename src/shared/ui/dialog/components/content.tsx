import type { ReactNode } from 'react';
import { useDialogContext } from '../hooks/useDialogContext';
import { createPortal } from 'react-dom';

type ContentSize = 'sm' | 'md' | 'lg';

type ContentProps = {
  /** 다이얼로그 내부에 렌더할 내용 */
  children: ReactNode;
  /** 다이얼로그 카드의 최대 너비 프리셋 */
  size?: ContentSize;
};
export function Content({ children, size = 'md' }: ContentProps) {
  const { open } = useDialogContext();

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className={`dialog-content dialog-content--${size}`}>{children}</div>,
    document.body,
    'DIALOG_CONTENT',
  );
}
