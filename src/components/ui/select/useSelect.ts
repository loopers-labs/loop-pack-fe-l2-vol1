'use client';

import { useState } from 'react';

type SelectKey = string | number;

type SelectedItemChange<T> = {
  selectedItem: T | null;
};

type UseSelectParams<T> = {
  items: T[];
  selectedItem?: T | null;
  defaultSelectedItem?: T | null;
  onSelectedItemChange?: (changes: SelectedItemChange<T>) => void;
  itemToKey: (item: T) => SelectKey;
  isItemDisabled?: (item: T, index: number) => boolean;
};

type UseSelectReturn<T> = {
  isOpen: boolean;
  selectedItem: T | null;
  highlightedIndex: number;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
  selectItem: (item: T | null) => void;
};

/**
 * Select가 필요한 곳에서 사용할 수 있는 hook
 */
export function useSelect<T>({
  items,
  selectedItem,
  defaultSelectedItem = null,
  onSelectedItemChange,
  itemToKey,
  isItemDisabled,
}: UseSelectParams<T>): UseSelectReturn<T> {
  const [isOpen, setIsOpen] = useState(false);

  const [internalSelectedItem, setInternalSelectedItem] = useState<T | null>(
    defaultSelectedItem,
  );

  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // selectedItem prop을 넘기면 controlled(source of truth가 사용처), 안 넘기면 uncontrolled(hook 내부 state가 source of truth)
  const isControlled = selectedItem !== undefined;

  const currentSelectedItem = isControlled
    ? selectedItem
    : internalSelectedItem;

  const getIsItemDisabled = (item: T, index: number) => {
    return isItemDisabled?.(item, index) ?? false;
  };

  const findSelectedIndex = () => {
    if (currentSelectedItem === null) {
      return -1;
    }

    return items.findIndex(
      (item) => itemToKey(item) === itemToKey(currentSelectedItem),
    );
  };

  const findFirstEnabledIndex = () => {
    return items.findIndex((item, index) => !getIsItemDisabled(item, index));
  };

  // 메뉴 열 때 highlight 시작 위치: 선택값이 있고 enabled면 거기서, 없거나 disabled면 첫 enabled item에서 시작
  const getInitialHighlightedIndex = () => {
    const selectedIndex = findSelectedIndex();

    if (
      selectedIndex >= 0 &&
      !getIsItemDisabled(items[selectedIndex], selectedIndex)
    ) {
      return selectedIndex;
    }

    return findFirstEnabledIndex();
  };

  const openMenu = () => {
    setIsOpen(true);
    setHighlightedIndex(getInitialHighlightedIndex());
  };

  const closeMenu = () => {
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const toggleMenu = () => {
    if (isOpen) {
      closeMenu();

      return;
    }

    openMenu();
  };

  // 값 선택시 controlled 여부에 따라 분기, 콜백 호출 후 메뉴 닫음
  const selectItem = (item: T | null) => {
    let nextSelectedItem = item;

    if (item !== null) {
      const index = items.findIndex(
        (currentItem) => itemToKey(currentItem) === itemToKey(item),
      );

      if (index < 0 || getIsItemDisabled(items[index], index)) {
        return;
      }

      nextSelectedItem = items[index];
    }

    if (!isControlled) {
      setInternalSelectedItem(nextSelectedItem);
    }

    onSelectedItemChange?.({ selectedItem: nextSelectedItem });
    closeMenu();
  };

  return {
    isOpen,
    selectedItem: currentSelectedItem,
    highlightedIndex,
    openMenu,
    closeMenu,
    toggleMenu,
    selectItem,
  };
}
