import type { JSX } from 'react';

// 사용처가 훅에 넣는 것들
export interface UseSelectOptions<T> {
  items: readonly T[];
  isItemDisabled?: (item: T) => boolean;
  itemToKey?: (item: T) => string | number; // 객체끼리 비교 시 동일 값인지 확인
  initialSelectedItem?: T | null;
  onSelectedItemChange?: (item: T | null) => void;
  onIsOpenChange?: (open: boolean) => void;
}

// 훅이 사용처에 돌려주는 것들
export interface UseSelectReturn<T> {
  isOpen: boolean;
  selectedItem: T | null; // 문자열이 아니라 객체 전체
  highlightedIndex: number;
  getToggleButtonProps: () => JSX.IntrinsicElements['button']; // 드롭다운 트리거(버튼)에 전달할 props를 반환
  getMenuProps: () => JSX.IntrinsicElements['ul']; // ul에 전달(role, 외부 클릭 감지용 ref)
  getItemProps: (args: {
    // li에 전달(선택/하이라이트/품절 처리)
    item: T;
    index: number;
  }) => JSX.IntrinsicElements['li'] & { disabled: boolean };
}
