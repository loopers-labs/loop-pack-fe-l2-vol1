import { type RefObject } from 'react';

import { useIsomorphicLayoutEffect } from '@/components/ui/shared/useIsomorphicLayoutEffect';

type UseScrollIntoViewParams = {
  isOpen: boolean;
  highlightedIndex: number;
  menuRef: RefObject<HTMLUListElement | null>;
  getItemId: (index: number) => string;
};

// 메뉴가 스크롤될 때 키보드 하이라이트가 보이는 영역 밖으로 나가지 않게 따라간다.
// scrollIntoView API는 페이지 등 조상 스크롤까지 움직여 화면이 튀므로, 메뉴 내부 스크롤만 조정한다.
// paint 전에 보정이 끝나야 End처럼 멀리 점프할 때 한 프레임 늦게 따라오는 깜빡임이 없다
export function useScrollIntoView({
  isOpen,
  highlightedIndex,
  menuRef,
  getItemId,
}: UseScrollIntoViewParams) {
  useIsomorphicLayoutEffect(() => {
    const menu = menuRef.current;
    const highlightedElement =
      highlightedIndex >= 0
        ? document.getElementById(getItemId(highlightedIndex))
        : null;

    if (!isOpen || menu === null || highlightedElement === null) {
      return;
    }

    const menuRect = menu.getBoundingClientRect();
    const itemRect = highlightedElement.getBoundingClientRect();

    if (itemRect.top < menuRect.top) {
      menu.scrollTop -= menuRect.top - itemRect.top;
    } else if (itemRect.bottom > menuRect.bottom) {
      menu.scrollTop += itemRect.bottom - menuRect.bottom;
    }
  }, [isOpen, highlightedIndex, menuRef, getItemId]);
}
