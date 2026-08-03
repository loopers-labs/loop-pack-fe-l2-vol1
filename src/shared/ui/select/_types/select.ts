import type { RefObject } from 'react';

export type SelectOption<T> = {
  value: T;
  isDisabled?: boolean;
};

export type UseSelectProps<T> = {
  options: SelectOption<T>[];
  selectedOption?: SelectOption<T> | null;
  onSelectedOptionChange?: (option: SelectOption<T>) => void;
};

export type ToggleButtonProps = {
  role: string;
  'aria-expanded': boolean;
  'aria-haspopup': 'listbox';
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
};

export type MenuProps = {
  role: 'listbox';
  'aria-hidden': boolean;
};

export type ItemProps = {
  role: 'option';
  'data-highlighted': boolean;
  'data-selected': boolean;
  'data-disabled': boolean;
  'aria-selected': boolean;
  'aria-disabled': boolean;
  onClick: () => void;
  onMouseEnter: () => void;
};

export type UseSelectReturn<T> = {
  isOpen: boolean;
  highlightedIndex: number;
  selectedOption: SelectOption<T> | null;
  containerRef: RefObject<HTMLDivElement | null>;
  getToggleButtonProps: () => ToggleButtonProps;
  getMenuProps: () => MenuProps;
  getItemProps: (args: { item: SelectOption<T>; index: number }) => ItemProps;
};
