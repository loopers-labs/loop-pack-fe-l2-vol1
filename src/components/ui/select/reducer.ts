import type { BaseSelectOption, SelectAction, SelectState } from './types';

/**
 * select 의 열림과 닫힘, option의 하이라이트 ( 마우스 올림이나 키보드 방향키 포커스 ), option 선택에 대한 액션을 커스텀훅 레이어에서 dispatch 받아,
 * 각 액션별로 상태를 적절히 설정 후 return 하는 reducer 순수함수입니다.
 *
 * - downshift 의 useSelect 패턴을 참고하였습니다.
 */
export const selectReducer = <T extends BaseSelectOption>(
  state: SelectState<T>,
  action: SelectAction<T>,
): SelectState<T> => {
  switch (action.type) {
    case 'SELECT.OPEN':
      return { ...state, isOpen: true, highlightedIndex: action.highlightedIndex };
    case 'SELECT.CLOSE':
      return { ...state, isOpen: false, highlightedIndex: -1 };
    case 'OPTION.HIGHLIGHT':
      return { ...state, highlightedIndex: action.index };
    case 'OPTION.SELECT':
      return { ...state, selected: action.option, isOpen: false, highlightedIndex: -1 };
    default:
      return state;
  }
};
