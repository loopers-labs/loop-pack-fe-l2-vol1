// Select (Headless) — 도메인을 모르는 재사용 프리미티브.
// 라이브러리/네이티브 select 요소 없이 순수 훅 로직만 제공한다. UI 마크업은 이 파일의 책임이 아니다.

import { useCallback, useState } from "react";

export interface UseSelectOptions<T> {
  options: T[];
  defaultSelected?: T;
  onChange?: (option: T) => void;
  isOptionDisabled?: (option: T) => boolean;
}

export interface SelectOptionState {
  selected: boolean;
  highlighted: boolean;
  disabled: boolean;
}

export type SelectKeyboardEvent = Pick<KeyboardEvent, "key" | "preventDefault">;

export interface UseSelectReturn<T> {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  selected: T | null;
  highlightedIndex: number;
  select: (option: T) => void;
  onKeyDown: (event: SelectKeyboardEvent) => void;
  getOptionState: (option: T) => SelectOptionState;
}

// 다음 선택 가능한(non-disabled) 인덱스를 찾는다.
// 스캔은 반드시 options.length로 바운드되어 종료를 보장한다.
// 경계(첫/끝)를 넘거나 모두 disabled/빈 배열이면 currentIndex를 그대로 반환한다(clamp, wrap 없음).
function findNextEnabledIndex<T>(
  options: T[],
  isDisabled: (option: T) => boolean,
  currentIndex: number,
  direction: 1 | -1,
): number {
  let candidate = currentIndex;

  for (let steps = 0; steps < options.length; steps += 1) {
    candidate += direction;

    if (candidate < 0 || candidate >= options.length) {
      return currentIndex;
    }

    const option = options[candidate];
    if (option !== undefined && !isDisabled(option)) {
      return candidate;
    }
  }

  return currentIndex;
}

export function useSelect<T>({
  options,
  defaultSelected,
  onChange,
  isOptionDisabled,
}: UseSelectOptions<T>): UseSelectReturn<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<T | null>(defaultSelected ?? null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const isDisabled = useCallback(
    (option: T) => (isOptionDisabled ? isOptionDisabled(option) : false),
    [isOptionDisabled],
  );

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const select = useCallback(
    (option: T) => {
      if (isDisabled(option)) {
        return;
      }
      setSelected(option);
      onChange?.(option);
    },
    [isDisabled, onChange],
  );

  const moveHighlight = useCallback(
    (direction: 1 | -1) => {
      setHighlightedIndex((current) =>
        findNextEnabledIndex(options, isDisabled, current, direction),
      );
    },
    [options, isDisabled],
  );

  const onKeyDown = useCallback(
    (event: SelectKeyboardEvent) => {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault?.();
          moveHighlight(1);
          break;
        case "ArrowUp":
          event.preventDefault?.();
          moveHighlight(-1);
          break;
        case "Enter": {
          event.preventDefault?.();
          const option = options[highlightedIndex];
          if (option !== undefined) {
            select(option);
          }
          break;
        }
        case "Escape":
          event.preventDefault?.();
          close();
          break;
        default:
          break;
      }
    },
    [moveHighlight, options, highlightedIndex, select, close],
  );

  const getOptionState = useCallback(
    (option: T): SelectOptionState => ({
      selected: option === selected,
      highlighted: options.indexOf(option) === highlightedIndex,
      disabled: isDisabled(option),
    }),
    [selected, options, highlightedIndex, isDisabled],
  );

  return {
    isOpen,
    open,
    close,
    toggle,
    selected,
    highlightedIndex,
    select,
    onKeyDown,
    getOptionState,
  };
}
