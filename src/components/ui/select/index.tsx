"use client";
import {
  ButtonHTMLAttributes,
  HTMLAttributes,
  LabelHTMLAttributes,
  LiHTMLAttributes,
  useId,
  useState,
} from "react";

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
  getItemProps: (params: { item: Item; index: number }) => LiHTMLAttributes<HTMLLIElement>;
  getItemState: (params: { item: Item; index: number }) => UseSelectItemState;
};

export function useSelect<Item>({
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
  const [highlightedIndex] = useState(-1);

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
      id: getItemId(index),
      role: "option" as const,
      "aria-selected": Object.is(currentSelectedItem, item),
      "aria-disabled": disabled,
      onClick: () => {
        if (disabled) {
          return;
        }

        selectItem(item);
      },
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
