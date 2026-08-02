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
//
// 아래는 import가 깨지지 않게 둔 placeholder다. 자유롭게 갈아엎어도 된다.

'use client';

import { DialogContext } from './context/context';
import { type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import { useDialog } from './hooks/useDialog';
import { Trigger } from './components/trigger';
import { Overlay } from './components/overlay';
import { Content } from './components/content';
import { Title } from './components/title';
import { Description } from './components/description';
import { Close } from './components/close';

type ControlledProps = {
  //controlled로 사용할 때 onOpenChange 강제하기
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  defaultOpen?: boolean;
};

type UncontrolledProps = {
  open?: undefined;
  onOpenChange?: (isOpen: boolean) => void;
  defaultOpen?: boolean;
};

type DialogProps = (ControlledProps | UncontrolledProps) & {
  children: ReactNode;
  /** Esc 입력 시 호출. event.preventDefault()를 부르면 닫히지 않는다 */
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  /** 오버레이 클릭 시 호출. event.preventDefault()를 부르면 닫히지 않는다 */
  onOverlayClick?: (event: ReactMouseEvent<HTMLDivElement>) => void;
  /** false면 Esc/오버레이 클릭 모두로 닫히지 않는다 (기본값: true) */
  closeOnOutsideInteraction?: boolean;
};

export function Dialog({
  open,
  onOpenChange,
  defaultOpen,
  children,
  onEscapeKeyDown,
  onOverlayClick,
  closeOnOutsideInteraction = true,
}: DialogProps) {
  const contextValue = useDialog({
    open,
    onOpenChange,
    defaultOpen,
    onEscapeKeyDown,
    onOverlayClick,
    closeOnOutsideInteraction,
  });

  return <DialogContext value={contextValue}>{children}</DialogContext>;
}

Dialog.Trigger = Trigger;
Dialog.Content = Content;
Dialog.Title = Title;
Dialog.Description = Description;
Dialog.Close = Close;
Dialog.Overlay = Overlay;
