'use client';

import {
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type LiHTMLAttributes,
  type Ref,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

import { useScrollIntoView } from '@/components/ui/select/useScrollIntoView';
import { useControlledState } from '@/shared/useControlledState';

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

type SelectItemDataAttributes = {
  'data-selected'?: string;
  'data-highlighted'?: string;
  'data-disabled'?: string;
};

type SelectElementProps<TElement extends HTMLElement> =
  HTMLAttributes<TElement> & {
    ref: (node: TElement | null) => void;
  };

function composeRefs<TElement>(
  consumerRef: Ref<TElement> | undefined,
  innerRef: (node: TElement | null) => void,
) {
  return (node: TElement | null) => {
    innerRef(node);

    if (typeof consumerRef === 'function') {
      consumerRef(node);
    } else if (consumerRef) {
      consumerRef.current = node;
    }
  };
}

// 사용처 핸들러를 먼저 실행하고, preventDefault로 거부하지 않았을 때만 내부 동작을 실행한다
function composeEventHandlers<TEvent extends { defaultPrevented: boolean }>(
  consumerHandler: ((event: TEvent) => void) | undefined,
  innerHandler: ((event: TEvent) => void) | undefined,
) {
  if (consumerHandler === undefined && innerHandler === undefined) {
    return undefined;
  }

  return (event: TEvent) => {
    consumerHandler?.(event);

    if (!event.defaultPrevented) {
      innerHandler?.(event);
    }
  };
}

type UseSelectReturn<T> = {
  isOpen: boolean;
  selectedItem: T | null;
  highlightedIndex: number;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
  selectItem: (item: T | null) => void;

  getToggleButtonProps: (
    props?: ButtonHTMLAttributes<HTMLButtonElement> & {
      ref?: Ref<HTMLButtonElement>;
    },
  ) => SelectElementProps<HTMLButtonElement>;
  getMenuProps: (
    props?: HTMLAttributes<HTMLUListElement> & {
      ref?: Ref<HTMLUListElement>;
    },
  ) => SelectElementProps<HTMLUListElement>;
  getItemProps: (
    params: { item: T; index: number } & LiHTMLAttributes<HTMLLIElement>,
  ) => LiHTMLAttributes<HTMLLIElement> & SelectItemDataAttributes;
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

  const [currentSelectedItem, setInternalSelectedItem] = useControlledState({
    controlled: selectedItem,
    defaultValue: defaultSelectedItem,
    component: 'useSelect',
    prop: 'selectedItem',
  });

  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const toggleButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLUListElement | null>(null);

  const baseId = useId();
  const menuId = `${baseId}menu`;

  const getItemId = useCallback(
    (index: number) => {
      return `${baseId}item-${index}`;
    },
    [baseId],
  );

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

  const getToggleButtonProps = ({
    onClick,
    onKeyDown,
    ref,
    ...restProps
  }: ButtonHTMLAttributes<HTMLButtonElement> & {
    ref?: Ref<HTMLButtonElement>;
  } = {}) => {
    return {
      ...restProps,
      ref: composeRefs(ref, (node) => {
        toggleButtonRef.current = node;
      }),
      role: 'combobox',
      'aria-haspopup': 'listbox' as const,
      'aria-expanded': isOpen,
      'aria-controls': menuId,
      // focus는 버튼에 둔 채, 키보드 하이라이트가 논리적으로 어느 옵션 위에 있는지 보조기기에 알린다
      'aria-activedescendant':
        isOpen && highlightedIndex >= 0
          ? getItemId(highlightedIndex)
          : undefined,
      onClick: composeEventHandlers(onClick, toggleMenu),
      onKeyDown: composeEventHandlers(onKeyDown, handleKeyDown),
    };
  };

  const getMenuProps = ({
    ref,
    ...restProps
  }: HTMLAttributes<HTMLUListElement> & {
    ref?: Ref<HTMLUListElement>;
  } = {}) => {
    return {
      ...restProps,
      ref: composeRefs(ref, (node) => {
        menuRef.current = node;
      }),
      id: menuId,
      role: 'listbox',
    };
  };

  const getItemProps = ({
    item,
    index,
    onMouseEnter,
    onClick,
    ...restProps
  }: { item: T; index: number } & LiHTMLAttributes<HTMLLIElement>) => {
    const selected =
      currentSelectedItem !== null &&
      itemToKey(item) === itemToKey(currentSelectedItem);
    const highlighted = index === highlightedIndex;
    const disabled = getIsItemDisabled(item, index);

    return {
      ...restProps,
      id: getItemId(index),
      role: 'option',
      'aria-selected': selected,
      'aria-disabled': disabled,
      'data-selected': selected ? '' : undefined,
      'data-highlighted': highlighted ? '' : undefined,
      'data-disabled': disabled ? '' : undefined,
      onMouseEnter: disabled
        ? undefined
        : composeEventHandlers(onMouseEnter, () => {
            setHighlightedIndex(index);
          }),
      onClick: disabled
        ? undefined
        : composeEventHandlers(onClick, () => {
            selectItem(item);
          }),
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

    const closeOnOutsidePointerUp = (event: PointerEvent) => {
      if (isSelectEventTarget(event.target)) {
        return;
      }

      closeMenu();
    };

    document.addEventListener('pointerup', closeOnOutsidePointerUp, true);

    return () => {
      document.removeEventListener('pointerup', closeOnOutsidePointerUp, true);
    };
  }, [isOpen, closeMenu]);

  useScrollIntoView({ isOpen, highlightedIndex, menuRef, getItemId });

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

    const isSameSelection =
      nextSelectedItem === null
        ? currentSelectedItem === null
        : currentSelectedItem !== null &&
          itemToKey(nextSelectedItem) === itemToKey(currentSelectedItem);

    setInternalSelectedItem(nextSelectedItem);

    // 이름(onSelectedItemChange)대로 값이 실제로 바뀔 때만 알린다. 같은 항목 재선택은 메뉴만 닫는다
    if (!isSameSelection) {
      onSelectedItemChange?.({ selectedItem: nextSelectedItem });
    }

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
  };
}
