import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import type { DialogContextValue } from '../context/context';

type UseDialogParams = {
  open?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  defaultOpen?: boolean;
  /** Esc 입력 시 호출. event.preventDefault()를 부르면 닫히지 않는다 */
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  /** 오버레이 클릭 시 호출. event.preventDefault()를 부르면 닫히지 않는다 */
  onOverlayClick?: (event: ReactMouseEvent<HTMLDivElement>) => void;
  /** false면 Esc/오버레이 클릭 모두로 닫히지 않는다 */
  closeOnOutsideInteraction: boolean;
};

/* AI-generated : dialog/index.tsx에 정의된 내용 hook으로 분리 요청 */
/**
 * @description Dialog의 상태·이펙트 로직을 담당하는 훅. index.tsx는 이 훅의 결과를 Context로 내려주기만 한다.
 * @param param0
 * @param param0.open controlled 열림 상태
 * @param param0.onOpenChange controlled일 때 열림 상태가 바뀔 때 호출
 * @param param0.defaultOpen uncontrolled 초기 열림 상태
 * @param param0.onEscapeKeyDown Esc 입력 시 호출
 * @param param0.onOverlayClick 오버레이 클릭 시 호출
 * @param param0.closeOnOutsideInteraction false면 Esc/오버레이 클릭으로 닫히지 않는다
 */
export function useDialog({
  open,
  onOpenChange,
  defaultOpen,
  onEscapeKeyDown,
  onOverlayClick,
  closeOnOutsideInteraction,
}: UseDialogParams): DialogContextValue {
  //open이 props로 넘어오면 controlled로 판단
  const isControlled = open !== undefined;
  //unControlled일 때 Dialog 열기 닫기 관리 상태
  const [dialogOpen, setDialogOpen] = useState<boolean>(defaultOpen || false);
  //controlled, unControlled 관계 없이 데이터를 context로 관리하기 위한 open 데이터
  const mergedOpen = isControlled ? open : dialogOpen;

  useEffect(() => {
    //open은 있는데 onOpenChange가 없으면 Esc/오버레이 클릭으로 닫을 방법이 없는 controlled Dialog가 됨
    if (process.env.NODE_ENV !== 'production') {
      if (open !== undefined && onOpenChange === undefined) {
        console.warn(
          '[Dialog] `open` prop이 있지만 `onOpenChange`가 없습니다. Esc/오버레이 클릭으로 닫히지 않는 controlled Dialog가 됩니다.',
        );
      }
    }
  }, [open, onOpenChange]);

  const setOpen = useCallback(
    (isOpen: boolean) => {
      if (!isControlled) {
        setDialogOpen(isOpen);
      }
      onOpenChange?.(isOpen);
    },
    [isControlled, onOpenChange],
  );

  const contextValue = useMemo(
    () => ({
      open: mergedOpen,
      setOpen,
      onOverlayClick,
      closeOnOutsideInteraction,
    }),
    [mergedOpen, setOpen, onOverlayClick, closeOnOutsideInteraction],
  );

  useEffect(() => {
    //닫혀있을 땐 리스너를 안 붙임(불필요한 전역 이벤트 리스너 방지)
    if (!mergedOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      onEscapeKeyDown?.(e);
      //closeOnOutsideInteraction=false면 콜백은 실행하되 닫지는 않음
      if (!closeOnOutsideInteraction) return;
      //콜백 안에서 preventDefault()를 부르면 이번 Esc는 닫힘을 취소할 수 있음
      if (e.defaultPrevented) return;
      setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mergedOpen, onEscapeKeyDown, closeOnOutsideInteraction, setOpen]);

  useEffect(() => {
    if (!mergedOpen) return;
    //다른 곳에서 이미 body overflow를 건드려놨을 수 있으니, 무조건 'hidden'이 아니라 닫힐 때 원래 값으로 복원
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mergedOpen]);

  return contextValue;
}
