'use client';

import {
  type HTMLAttributes,
  type KeyboardEvent,
  type LiHTMLAttributes,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

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

type SelectItemState = {
  selected: boolean;
  highlighted: boolean;
  disabled: boolean;
};

type SelectElementProps<TElement extends HTMLElement> =
  HTMLAttributes<TElement> & {
    ref: (node: TElement | null) => void;
  };

type UseSelectReturn<T> = {
  isOpen: boolean;
  selectedItem: T | null;
  highlightedIndex: number;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
  selectItem: (item: T | null) => void;

  getToggleButtonProps: () => SelectElementProps<HTMLButtonElement>;
  getMenuProps: () => SelectElementProps<HTMLUListElement>;
  getItemProps: (params: {
    item: T;
    index: number;
  }) => LiHTMLAttributes<HTMLLIElement>;
  getItemState: (params: { item: T; index: number }) => SelectItemState;
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

  const toggleButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLUListElement | null>(null);

  const baseId = useId();
  const menuId = `${baseId}menu`;

  const getItemId = (index: number) => {
    return `${baseId}item-${index}`;
  };

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

  const findLastEnabledIndex = () => {
    for (let index = items.length - 1; index >= 0; index -= 1) {
      if (!getIsItemDisabled(items[index], index)) {
        return index;
      }
    }

    return -1;
  };

  const findNextEnabledIndex = (startIndex: number) => {
    for (let index = startIndex + 1; index < items.length; index += 1) {
      if (!getIsItemDisabled(items[index], index)) {
        return index;
      }
    }

    return startIndex;
  };

  const findPreviousEnabledIndex = (startIndex: number) => {
    for (let index = startIndex - 1; index >= 0; index -= 1) {
      if (!getIsItemDisabled(items[index], index)) {
        return index;
      }
    }

    return startIndex;
  };

  const highlightNextItem = () => {
    if (!isOpen) {
      openMenu();

      return;
    }

    setHighlightedIndex((currentIndex) => {
      if (currentIndex === -1) {
        return findFirstEnabledIndex();
      }

      return findNextEnabledIndex(currentIndex);
    });
  };

  const highlightPreviousItem = () => {
    if (!isOpen) {
      openMenu();

      return;
    }

    setHighlightedIndex((currentIndex) => {
      if (currentIndex === -1) {
        return findFirstEnabledIndex();
      }

      return findPreviousEnabledIndex(currentIndex);
    });
  };

  // 현재 하이라이트 된 아이템을 선택
  const selectHighlightedItem = () => {
    if (highlightedIndex < 0) {
      return;
    }

    const item = items[highlightedIndex];

    if (item === undefined) {
      return;
    }

    selectItem(item);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      highlightNextItem();

      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      highlightPreviousItem();

      return;
    }

    if (event.key === 'Home' && isOpen) {
      event.preventDefault();
      setHighlightedIndex(findFirstEnabledIndex());

      return;
    }

    if (event.key === 'End' && isOpen) {
      event.preventDefault();
      setHighlightedIndex(findLastEnabledIndex());

      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();

      if (!isOpen) {
        openMenu();

        return;
      }

      selectHighlightedItem();

      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();

      return;
    }

    // Tab 이동은 브라우저 기본 focus 이동에 맡기고, 열린 메뉴만 닫는다
    if (event.key === 'Tab') {
      closeMenu();
    }
  };

  const getToggleButtonProps = () => {
    return {
      ref: (node: HTMLButtonElement | null) => {
        toggleButtonRef.current = node;
      },
      'aria-expanded': isOpen,
      'aria-controls': menuId,
      // focus는 버튼에 둔 채, 키보드 하이라이트가 논리적으로 어느 옵션 위에 있는지 보조기기에 알린다
      'aria-activedescendant':
        isOpen && highlightedIndex >= 0
          ? getItemId(highlightedIndex)
          : undefined,
      onClick: toggleMenu,
      onKeyDown: handleKeyDown,
    };
  };

  const getMenuProps = () => {
    return {
      ref: (node: HTMLUListElement | null) => {
        menuRef.current = node;
      },
      id: menuId,
      role: 'listbox',
    };
  };

  const getItemProps = ({ item, index }: { item: T; index: number }) => {
    const { selected, disabled } = getItemState({ item, index });

    return {
      id: getItemId(index),
      role: 'option',
      'aria-selected': selected,
      'aria-disabled': disabled,
      onMouseEnter: disabled
        ? undefined
        : () => {
            setHighlightedIndex(index);
          },
      onClick: disabled
        ? undefined
        : () => {
            selectItem(item);
          },
    };
  };

  // 화면 계산과 hook 내부 판단(itemToKey 비교, isItemDisabled)이 어긋나지 않게 상태를 한 곳에서 계산해 내려준다
  const getItemState = ({ item, index }: { item: T; index: number }) => {
    return {
      selected:
        currentSelectedItem !== null &&
        itemToKey(item) === itemToKey(currentSelectedItem),
      highlighted: index === highlightedIndex,
      disabled: getIsItemDisabled(item, index),
    };
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

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setHighlightedIndex(-1);
  }, []);

  const toggleMenu = () => {
    if (isOpen) {
      closeMenu();

      return;
    }

    openMenu();
  };

  // 바깥 클릭 닫기. trigger/menu ref를 따로 봐서 DOM 배치가 달라도 내부 클릭을 유지한다
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const isSelectEventTarget = (target: EventTarget | null) => {
      if (!(target instanceof Node)) {
        return false;
      }

      // 현재 타겟이 버튼 안이거나 메뉴 안이면 내부로 판정
      return [toggleButtonRef.current, menuRef.current].some((element) => {
        return element !== null && element.contains(target);
      });
    };

    const closeOnOutsidePointerDown = (event: PointerEvent) => {
      if (isSelectEventTarget(event.target)) {
        return;
      }

      closeMenu();
    };

    document.addEventListener('pointerdown', closeOnOutsidePointerDown, true);

    return () => {
      document.removeEventListener(
        'pointerdown',
        closeOnOutsidePointerDown,
        true,
      );
    };
  }, [isOpen, closeMenu]);

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

    getToggleButtonProps,
    getMenuProps,
    getItemProps,
    getItemState,
  };
}
