import type { JSX } from 'react';

// AI를 활용하여 인터페이스 구성
// 사용처가 훅에 넣는 것들
export type UseSelectOptions<T> = {
  items: readonly T[];
  isItemDisabled?: (item: T) => boolean; // 특정 항목을 클릭하지 못하게 할 때
  initialSelectedItem?: T | null;
  onSelectedItemChange?: (item: T | null) => void; // 선택이 바뀌었을 때 부가 동작을 처리(서버 전송, 로컬스토리지 저장 등)
  onIsOpenChange?: (open: boolean) => void; // 드롭다운이 열리거나 닫힐 때 호출될 콜백(열릴 때 lazy 데이터 fetch, 다른 UI 닫기 등)
} & (T extends object // T가 객체 타입이면 itemToKey 필수, 원시 타입이면 옵셔널(AI 활용 X)
  ? { itemToKey: (item: T) => string | number }
  : { itemToKey?: (item: T) => string | number });

// 훅이 사용처에 돌려주는 것들
export interface UseSelectReturn<T> {
  isOpen: boolean;
  selectedItem: T | null; // 문자열이 아니라 객체 전체
  highlightedIndex: number; // 키보드로 이동 중인 항목의 인덱스
  getToggleButtonProps: () => JSX.IntrinsicElements['button']; // 드롭다운 트리거(버튼)에 전달할 props를 반환
  getMenuProps: () => JSX.IntrinsicElements['ul']; // ul에 전달(role = "listbox", 외부 클릭 감지용 ref 등)
  getItemProps: (args: {
    // li에 전달(선택/하이라이트/품절 처리)
    item: T;
    index: number;
  }) => JSX.IntrinsicElements['li'] & {
    disabled: boolean; // disabled 여부를 별도로 노출
    isSelected: boolean; // 현재 항목이 선택된 항목인지
    isHighlighted: boolean; // 키보드로 이동 중인 항목인지
  };
}
