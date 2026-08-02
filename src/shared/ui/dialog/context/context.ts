import { createContext } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';

export interface DialogContextValue {
  open: boolean;
  setOpen: (isOpen: boolean) => void;
  /** 오버레이 클릭 시 호출. event.preventDefault()를 부르면 닫히지 않는다 */
  onOverlayClick?: (event: ReactMouseEvent<HTMLDivElement>) => void;
  /** false면 오버레이 클릭으로 닫히지 않는다 */
  closeOnOutsideInteraction: boolean;
}

export const DialogContext = createContext<DialogContextValue | null>(null);
