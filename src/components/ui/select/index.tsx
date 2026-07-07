"use client";
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  KeyboardEvent,
  LabelHTMLAttributes,
  RefCallback,
} from "react";
import { useId, useRef, useState } from "react";

type UseSelectParams<Item> = {
  items: Item[];
  itemToString: (item: Item | null) => string;
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
  getToggleButtonProps: () => ButtonHTMLAttributes<HTMLButtonElement>;
  getMenuProps: () => HTMLAttributes<HTMLUListElement>;
  getLabelProps: () => LabelHTMLAttributes<HTMLLabelElement>;
  getItemProps: (params: { item: Item; index: number }) => UseSelectItemProps;
  getItemState: (params: { item: Item; index: number }) => UseSelectItemState;
};

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

  for (let step = 1; step <= items.length; step += 1) {
    const nextIndex = (currentIndex + direction * step + items.length) % items.length;
    const nextItem = items[nextIndex];

    if (!isItemDisabled(nextItem, nextIndex)) {
      return nextIndex;
    }
  }
  return -1;
}

export function useSelect<Item>({
  items,
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

  const baseId = useId();
  const labelId = `${baseId}-label`;
  const toggleButtonId = `${baseId}-toggle`;
  const menuId = `${baseId}-menu`;
  const getItemId = (index: number) => {
    return `${baseId}-item-${index}`;
  };

  const currentSelectedItem = isControlled ? selectedItem : internalSelectedItem;

  const openMenu = () => {
    setIsOpen(true);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  const selectItem = (item: Item) => {
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
    itemRefs.current[nextIndex]?.scrollIntoView({ block: "nearest" });
    setHighlightedIndex(nextIndex);
  };

  const handleToggleButtonKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      moveHighlight(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      moveHighlight(-1);
      return;
    }

    if (event.key === "Enter") {
      const highlightedItem = items[highlightedIndex];

      if (highlightedItem !== undefined) {
        event.preventDefault();
        selectItem(highlightedItem);
      }

      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
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

  const getItemState = ({ item, index }: { item: Item; index: number }) => {
    return {
      selected: Object.is(currentSelectedItem, item),
      highlighted: highlightedIndex === index,
      disabled: isItemDisabled(item, index),
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
      "aria-selected": Object.is(currentSelectedItem, item),
      "aria-disabled": disabled,
      onMouseMove: () => handleItemMouseMove(index, disabled),
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
    getToggleButtonProps,
    getLabelProps,
    getMenuProps,
    getItemProps,
    getItemState,
  };
}
