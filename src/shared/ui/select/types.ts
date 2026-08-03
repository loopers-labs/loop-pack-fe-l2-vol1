/**
 * 기본 확정 옵션 타입
 */
export type BaseSelectOption = { value: string; disabled?: boolean };

/**
 * 리듀서 초기 상태
 */
export type SelectState<T extends BaseSelectOption> = {
  /**
   * Select 트리거 여부
   */
  isOpen: boolean;

  /**
   * 선택된 아이템 타입, 선택된게 없다면 null
   */
  selected: T | null;

  /**
   * 하이라이트 여부
   */
  highlightedIndex: number;
};

/**
 * reducer 액션
 */
export type SelectAction<T extends BaseSelectOption> =
  | { type: 'SELECT.OPEN'; highlightedIndex: number }
  | { type: 'SELECT.CLOSE' }
  | { type: 'OPTION.HIGHLIGHT'; index: number }
  | { type: 'OPTION.SELECT'; option: T };
