import { useId, useState } from 'react';
import type { KeyboardEvent } from 'react';

// Headless Select 로직 한 벌. "생김새"는 전혀 모른다 — 상태와 핸들러만 노출한다.
//
// 인터페이스 설계 근거:
//   - value = 제네릭 T (옵션 "객체 전체"). 문자열 id가 아니라 객체를 다뤄야
//     onChange가 가격·배송 계산에 쓸 값을 그대로 돌려준다.
//   - getOptionProps(item, index)가 { selected, highlighted, disabled } + 핸들러를
//     함께 반환한다(prop getter). 사용처가 highlightedIndex를 매번 비교하는 대신,
//     "이 옵션이 지금 어떤 상태인지"만 받아 색을 정한다 → 같은 로직으로 UI 3종 커버.
//   - highlighted(방향키로 훑는 중) vs selected(Enter로 확정)를 분리한다.
//     안 나누면 "방향키만 눌러도 값이 바뀌는" 버그가 난다(WAI-ARIA: 탐색은 값을 안 바꾼다).

export type UseSelectConfig<T> = {
  items: T[];
  itemToKey: (item: T) => string | number;
  isItemDisabled?: (item: T) => boolean;
  defaultSelected?: T | null;
  onChange?: (item: T) => void;
};

export type OptionState = {
  selected: boolean;
  highlighted: boolean;
  disabled: boolean;
};

export type OptionProps = OptionState & {
  id: string;
  role: 'option';
  'aria-selected': boolean;
  'aria-disabled': boolean;
  onClick: () => void;
  onMouseEnter: () => void;
};

export type TriggerProps = {
  type: 'button';
  'aria-haspopup': 'listbox';
  'aria-expanded': boolean;
  'aria-activedescendant': string | undefined;
  onClick: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
};

export type ListProps = {
  role: 'listbox';
  id: string;
};

export type UseSelect<T> = {
  isOpen: boolean;
  selectedItem: T | null;
  highlightedIndex: number;
  getTriggerProps: () => TriggerProps;
  getListProps: () => ListProps;
  getOptionProps: (item: T, index: number) => OptionProps;
};

export function useSelect<T>({
  items,
  itemToKey,
  isItemDisabled,
  defaultSelected = null,
  onChange,
}: UseSelectConfig<T>): UseSelect<T> {
  const baseId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(defaultSelected);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const disabledAt = (index: number): boolean =>
    isItemDisabled ? isItemDisabled(items[index]) : false;

  // start부터 dir 방향으로 이동하며 처음 만나는 '선택 가능한' 인덱스. 없으면 -1.
  const findEnabled = (start: number, dir: 1 | -1): number => {
    for (let i = start; i >= 0 && i < items.length; i += dir) {
      if (!disabledAt(i)) return i;
    }
    return -1;
  };

  const selectedIndex = (): number =>
    selectedItem === null
      ? -1
      : items.findIndex((item) => itemToKey(item) === itemToKey(selectedItem));

  const open = (): void => {
    setIsOpen(true);
    const selected = selectedIndex();
    // 열 때 선택값(선택 가능하면)에, 없으면 첫 선택 가능 항목에 highlight를 건다.
    setHighlightedIndex(
      selected >= 0 && !disabledAt(selected) ? selected : findEnabled(0, 1),
    );
  };

  const close = (): void => {
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const selectItem = (item: T): void => {
    if (isItemDisabled?.(item)) return; // 품절은 선택 불가
    setSelectedItem(item);
    onChange?.(item);
    close();
  };

  const moveHighlight = (dir: 1 | -1): void => {
    const from =
      highlightedIndex < 0 ? (dir === 1 ? -1 : items.length) : highlightedIndex;
    const next = findEnabled(from + dir, dir);
    if (next >= 0) setHighlightedIndex(next); // 끝에서 더 가면 그대로(래핑 안 함)
  };

  const optionId = (index: number): string => `${baseId}-opt-${index}`;

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    switch (event.key) {
      // 방향키는 열린 리스트 안에서만 동작한다. 닫힘 상태에선 무반응 —
      // preventDefault도 하지 않아 페이지 스크롤을 막지 않는다(열기는 Enter/Space/클릭).
      case 'ArrowDown':
        if (isOpen) {
          event.preventDefault();
          moveHighlight(1);
        }
        break;
      case 'ArrowUp':
        if (isOpen) {
          event.preventDefault();
          moveHighlight(-1);
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (isOpen && highlightedIndex >= 0)
          selectItem(items[highlightedIndex]);
        else if (!isOpen) open();
        break;
      case 'Escape':
        if (isOpen) {
          event.preventDefault();
          close();
        }
        break;
      case 'Home':
        if (isOpen) {
          event.preventDefault();
          setHighlightedIndex(findEnabled(0, 1));
        }
        break;
      case 'End':
        if (isOpen) {
          event.preventDefault();
          setHighlightedIndex(findEnabled(items.length - 1, -1));
        }
        break;
    }
  };

  const getTriggerProps = (): TriggerProps => ({
    type: 'button',
    'aria-haspopup': 'listbox',
    'aria-expanded': isOpen,
    'aria-activedescendant':
      isOpen && highlightedIndex >= 0 ? optionId(highlightedIndex) : undefined,
    onClick: () => (isOpen ? close() : open()),
    onKeyDown: onTriggerKeyDown,
  });

  const getListProps = (): ListProps => ({
    role: 'listbox',
    id: `${baseId}-list`,
  });

  const getOptionProps = (item: T, index: number): OptionProps => {
    const disabled = isItemDisabled?.(item) ?? false;
    const selected =
      selectedItem !== null && itemToKey(selectedItem) === itemToKey(item);
    const highlighted = index === highlightedIndex;
    return {
      id: optionId(index),
      role: 'option',
      'aria-selected': selected,
      'aria-disabled': disabled,
      selected,
      highlighted,
      disabled,
      onClick: () => selectItem(item),
      onMouseEnter: () => {
        if (!disabled) setHighlightedIndex(index);
      },
    };
  };

  return {
    isOpen,
    selectedItem,
    highlightedIndex,
    getTriggerProps,
    getListProps,
    getOptionProps,
  };
}
