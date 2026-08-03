export type Size = {
  value: number;
  stock: number;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  originalPrice: number | null;
  image: string;
  freeShipping: boolean;
  stock: number;
  sizes: Size[];
};

export type TextOption = {
  id: string;
  label: string;
  price: number;
  pricePerUnit: number;
  freeShipping: boolean;
  stock: number;
  isMaxDiscount: boolean;
};

export type UseSelectProps<T> = {
  options: T[];
  isDisabled: (option: T) => boolean;
};

export type UseSelectReturn<T> = {
  isOpen: boolean;
  selectedOption: T | null;
  hightlightedIndex: number;
  handleToggle: () => void;
  handleSelect: (option: T) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleHighlight: (index: number) => void;
};
