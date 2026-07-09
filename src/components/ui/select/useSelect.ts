"use client";
import type {
  ButtonHTMLAttributes,
  FocusEvent,
  HTMLAttributes,
  KeyboardEvent,
  LabelHTMLAttributes,
  MouseEvent,
  RefCallback,
} from "react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

type UseSelectParams<Item> = {
  items: Item[];
  getItemKey?: (item: Item | null) => unknown;
  isItemDisabled?: (item: Item, index: number) => boolean;
  selectedItem?: Item | null;
  defaultSelectedItem?: Item | null;
  onSelectedItemChange?: (item: Item) => void;
};

type UseSelectItemState = {
  selected: boolean;
  highlighted: boolean;
  disabled: boolean;
};

type UseSelectItemProps = HTMLAttributes<HTMLElement> & {
  ref: RefCallback<HTMLElement>;
};

type UseSelectReturn<Item> = {
  isOpen: boolean;
  selectedItem: Item | null;
  highlightedIndex: number;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
  selectItem: (item: Item) => void;
  getRootProps: () => UseSelectRootProps;
  getToggleButtonProps: () => ButtonHTMLAttributes<HTMLButtonElement>;
  getMenuProps: () => HTMLAttributes<HTMLUListElement>;
  getLabelProps: () => LabelHTMLAttributes<HTMLLabelElement>;
  getItemProps: (params: { item: Item; index: number }) => UseSelectItemProps;
  getItemState: (params: { item: Item; index: number }) => UseSelectItemState;
};

type UseSelectRootProps = HTMLAttributes<HTMLElement> & {
  ref: RefCallback<HTMLElement>;
};

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function getNextEnabledIndex<Item>({
  items,
  currentIndex,
  direction,
  isItemDisabled,
}: {
  items: Item[];
  currentIndex: number;
  direction: -1 | 1;
  isItemDisabled: (item: Item, index: number) => boolean;
}) {
  if (items.length === 0) {
    return -1;
  }

  if (currentIndex === -1) {
    if (direction === 1) {
      return getFirstEnabledIndex(items, isItemDisabled);
    }

    return getLastEnabledIndex(items, isItemDisabled);
  }

  for (let step = 1; step <= items.length; step += 1) {
    const nextIndex = (currentIndex + direction * step + items.length) % items.length;
    const nextItem = items[nextIndex];

    if (!isItemDisabled(nextItem, nextIndex)) {
      return nextIndex;
    }
  }
  return -1;
}

function getFirstEnabledIndex<Item>(
  items: Item[],
  isItemDisabled: (item: Item, index: number) => boolean,
) {
  return items.findIndex((item, index) => {
    return !isItemDisabled(item, index);
  });
}

function getLastEnabledIndex<Item>(
  items: Item[],
  isItemDisabled: (item: Item, index: number) => boolean,
) {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (!isItemDisabled(items[index], index)) {
      return index;
    }
  }

  return -1;
}

function getSelectedItemIndex<Item>({
  items,
  selectedItem,
  getItemKey,
  isItemDisabled,
}: {
  items: Item[];
  selectedItem: Item | null | undefined;
  getItemKey: (item: Item | null) => unknown;
  isItemDisabled: (item: Item, index: number) => boolean;
}) {
  if (selectedItem == null) {
    return -1;
  }

  const selectedItemKey = getItemKey(selectedItem);

  return items.findIndex((item, index) => {
    return Object.is(getItemKey(item), selectedItemKey) && !isItemDisabled(item, index);
  });
}

export function useSelect<Item>({
  items,
  getItemKey = (item) => item,
  selectedItem,
  defaultSelectedItem = null,
  onSelectedItemChange,
  isItemDisabled = () => false,
}: UseSelectParams<Item>): UseSelectReturn<Item> {
  const isControlled = selectedItem !== undefined;
  const [internalSelectedItem, setInternalSelectedItem] = useState<Item | null>(
    defaultSelectedItem,
  );
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const rootRef = useRef<HTMLElement | null>(null);

  const baseId = useId();
  const labelId = `${baseId}-label`;
  const toggleButtonId = `${baseId}-toggle`;
  const menuId = `${baseId}-menu`;
  const getItemId = (index: number) => {
    return `${baseId}-item-${index}`;
  };

  const currentSelectedItem = isControlled ? selectedItem : internalSelectedItem;

  const highlightItem = (index: number) => {
    setHighlightedIndex(index);
  };

  useIsomorphicLayoutEffect(() => {
    if (!isOpen || highlightedIndex < 0) {
      return;
    }

    itemRefs.current[highlightedIndex]?.scrollIntoView({ block: "nearest" });
  }, [isOpen, highlightedIndex]);

  const getInitialHighlightedIndex = () => {
    const selectedIndex = getSelectedItemIndex({
      items,
      selectedItem: currentSelectedItem,
      getItemKey,
      isItemDisabled,
    });

    if (selectedIndex !== -1) {
      return selectedIndex;
    }

    return getFirstEnabledIndex(items, isItemDisabled);
  };

  const openMenu = () => {
    if (isOpen) {
      return;
    }

    setIsOpen(true);
    highlightItem(getInitialHighlightedIndex());
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

  const selectItem = (item: Item) => {
    const itemKey = getItemKey(item);
    const itemIndex = items.findIndex((candidate) => {
      return Object.is(getItemKey(candidate), itemKey);
    });

    if (itemIndex === -1 || isItemDisabled(item, itemIndex)) {
      return;
    }

    if (!isControlled) {
      setInternalSelectedItem(item);
    }

    onSelectedItemChange?.(item);
    closeMenu();
  };

  const moveHighlight = (direction: 1 | -1) => {
    const nextIndex = getNextEnabledIndex({
      items,
      currentIndex: highlightedIndex,
      direction,
      isItemDisabled,
    });

    if (nextIndex === -1) {
      return;
    }

    highlightItem(nextIndex);
  };

  const handleToggleButtonKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (!isOpen) {
        openMenu();
        return;
      }

      moveHighlight(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (!isOpen) {
        openMenu();
        return;
      }

      moveHighlight(-1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      if (!isOpen) {
        openMenu();
        return;
      }

      const highlightedItem = items[highlightedIndex];

      if (highlightedItem !== undefined && !isItemDisabled(highlightedItem, highlightedIndex)) {
        selectItem(highlightedItem);
      }

      return;
    }

    if (event.key === "Home") {
      event.preventDefault();

      if (!isOpen) {
        openMenu();
        return;
      }

      const firstEnabledIndex = getFirstEnabledIndex(items, isItemDisabled);

      if (firstEnabledIndex !== -1) {
        highlightItem(firstEnabledIndex);
      }

      return;
    }

    if (event.key === "End") {
      event.preventDefault();

      if (!isOpen) {
        openMenu();
        return;
      }

      const lastEnabledIndex = getLastEnabledIndex(items, isItemDisabled);

      if (lastEnabledIndex !== -1) {
        highlightItem(lastEnabledIndex);
      }

      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key === "Tab") {
      closeMenu();
    }
  };

  const handleItemMouseMove = (index: number, disabled: boolean) => {
    if (disabled) {
      return;
    }

    setHighlightedIndex(index);
  };

  const handleItemClick = (item: Item, disabled: boolean) => {
    if (disabled) {
      return;
    }

    selectItem(item);
  };

  const handleItemMouseDown = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
  };

  const handleRootBlur = (event: FocusEvent<HTMLElement>) => {
    const nextFocusedElement = event.relatedTarget;

    if (nextFocusedElement instanceof Node && rootRef.current?.contains(nextFocusedElement)) {
      return;
    }

    closeMenu();
  };

  const getItemState = ({ item, index }: { item: Item; index: number }) => {
    return {
      selected: Object.is(getItemKey(currentSelectedItem ?? null), getItemKey(item)),
      highlighted: highlightedIndex === index,
      disabled: isItemDisabled(item, index),
    };
  };

  const getRootProps = () => {
    return {
      ref: (node: HTMLElement | null) => {
        rootRef.current = node;
      },
      onBlur: handleRootBlur,
    };
  };

  const getToggleButtonProps = () => {
    return {
      id: toggleButtonId,
      type: "button" as const,
      "aria-haspopup": "listbox" as const,
      "aria-expanded": isOpen,
      "aria-controls": menuId,
      "aria-labelledby": labelId,
      "aria-activedescendant": highlightedIndex >= 0 ? getItemId(highlightedIndex) : undefined,
      onClick: toggleMenu,
      onKeyDown: handleToggleButtonKeyDown,
    };
  };

  const getMenuProps = () => {
    return {
      id: menuId,
      role: "listbox" as const,
      "aria-labelledby": labelId,
    };
  };

  const getLabelProps = () => {
    return {
      id: labelId,
      htmlFor: toggleButtonId,
    };
  };

  const getItemProps = ({ item, index }: { item: Item; index: number }) => {
    const disabled = isItemDisabled(item, index);

    return {
      ref: (node: HTMLElement | null) => {
        itemRefs.current[index] = node;
      },
      id: getItemId(index),
      role: "option" as const,
      "aria-selected": Object.is(getItemKey(currentSelectedItem ?? null), getItemKey(item)),
      "aria-disabled": disabled,
      onMouseMove: () => handleItemMouseMove(index, disabled),
      onMouseDown: handleItemMouseDown,
      onClick: () => handleItemClick(item, disabled),
    };
  };

  return {
    isOpen,
    selectedItem: currentSelectedItem ?? null,
    highlightedIndex,
    openMenu,
    closeMenu,
    toggleMenu,
    selectItem,
    getRootProps,
    getToggleButtonProps,
    getLabelProps,
    getMenuProps,
    getItemProps,
    getItemState,
  };
}
