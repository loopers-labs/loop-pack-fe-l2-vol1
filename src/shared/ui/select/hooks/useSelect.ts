import { type KeyboardEvent, useReducer } from 'react';

import { selectReducer } from '../reducer';
import type { BaseSelectOption, SelectState } from '../types';

export type UseSelectProps<T extends BaseSelectOption> = {
  options: T[];
  defaultValue?: T;
  placeholder?: string;
  onChange?: (option: T) => void;
};

/**
 * 선택된 옵션에 대해 하이라이트 여부, selected 여부를 알아야 UI를 그릴 수 있습니다.
 */
export const useSelect = <T extends BaseSelectOption>({ options, defaultValue, onChange }: UseSelectProps<T>) => {
  const [state, dispatch] = useReducer(selectReducer<T>, {
    isOpen: false,
    selected: defaultValue ?? null,
    highlightedIndex: -1,
  } satisfies SelectState<T>);

  /**
   * Select가 열릴 때, 선택된 값이 있다면 선택된 값의 인덱스를 리턴하고, 아니라면 첫번째 인덱스를 리턴합니다..
   * - return 문 쪽은 AI가 작성해주었습니다.
   */
  const getOpenHighlight = (): number => {
    const selected = state.selected;

    if (selected) {
      const index = options.findIndex((o) => o.value === selected.value);

      if (index >= 0 && !options[index]?.disabled) return index;
    }

    return getNextEnabledIndex({ options, from: -1, direction: 1 });
  };

  /** 앞/뒤 방향으로 품절(disabled)을 건너뛴 다음 index 를 찾는다. 전부 불가면 -1.
   * - AI가 작성해주었습니다.. 솔직히 for문 로직이 잘 이해가 되지 않아요 ㅠ
   */
  const getNextEnabledIndex = <T extends BaseSelectOption>({
    options,
    from,
    direction,
  }: {
    options: T[];
    from: number;
    direction: 1 | -1;
  }) => {
    const len = options.length;

    if (len === 0) return -1;

    for (let step = 1; step <= len; step++) {
      const next = (((from + direction * step) % len) + len) % len;

      if (!options[next]?.disabled) return next;
    }

    return -1;
  };

  /**
   * Select 열릴 때 dispatch
   */
  const open = () => dispatch({ type: 'SELECT.OPEN', highlightedIndex: getOpenHighlight() });

  /**
   * Select 닫힐 때 dispatch
   */
  const close = () => dispatch({ type: 'SELECT.CLOSE' });

  /**
   * 옵션이 하이라이트 되었을 떄 reducer로 `OPTION.HIGHLIGHT` 액션으로 dispatch 합니다.
   * - (키보드로 움직이거나 마우스 hover, 선택 되있는 상태일 때)
   */
  const toggle = () => {
    if (state.isOpen) {
      close();

      return;
    }

    open();
  };

  /**
   * 옵션이 하이라이트 되었을 떄 reducer로 `OPTION.HIGHLIGHT` 액션으로 dispatch 합니다.
   * - (키보드로 움직이거나 마우스 hover, 선택 되있는 상태일 때)
   */
  const highlight = (index: number) => dispatch({ type: 'OPTION.HIGHLIGHT', index });

  const selectOption = (option: T) => {
    if (option.disabled) return;

    dispatch({ type: 'OPTION.SELECT', option });

    onChange?.(option);
  };

  /**
   * option 키보드 위, 아랫방향키로 움직일 떄
   */
  const optionNavigate = (direction: 1 | -1) => {
    if (!state.isOpen) {
      open();

      return;
    }

    const next = getNextEnabledIndex({ options, from: state.highlightedIndex, direction });

    if (next !== -1) highlight(next);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        optionNavigate(1);

        break;

      case 'ArrowUp':
        e.preventDefault();
        optionNavigate(-1);

        break;

      case 'Enter':

      // 스페이스바 키 입니다
      case ' ': {
        e.preventDefault();

        if (!state.isOpen) {
          open();

          break;
        }

        const target = options[state.highlightedIndex];

        if (target) selectOption(target);

        break;
      }

      case 'Escape':
        if (state.isOpen) {
          e.preventDefault();
          close();
        }

        break;

      case 'Tab':
        if (state.isOpen) {
          close();
        }

        break;

      default:
        break;
    }
  };

  /** 트리거 버튼에 스프레드 — 열기/닫기 + 키보드 전체를 담당. */
  const getToggleProps = () => ({
    type: 'button' as const,
    onClick: toggle,
    onKeyDown,
  });

  /** 이벤트핸들러를 미리 정의하여 내부 상태에 상황에 맞게 상태를 업데이트
   * - reducer의 dispatch로 이어집니다.
   */
  const getOptionProps = (option: T, index: number) => ({
    onClick: () => selectOption(option),
    onMouseEnter: () => {
      if (!option.disabled) highlight(index);
    },
  });

  /** 요구사항인 선택여부, 하이라이트여부, 비활성화 여부로 사용처에서 스타일링할 수 있게 상태묶음 */
  const getOptionState = (option: T, index: number) => ({
    isSelected: state.selected?.value === option.value,
    isHighlighted: state.highlightedIndex === index,
    isDisabled: option.disabled ?? false,
  });

  return {
    isOpen: state.isOpen,
    selected: state.selected,
    highlightedIndex: state.highlightedIndex,
    close,
    getToggleProps,
    getOptionProps,
    getOptionState,
  };
};
