export type Size = {
  value: number;
  stock: number;
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

export type ThumbnailOption = {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice: number | null;
  freeShipping: boolean;
  sizes: Array<{ stock: number }>;
};

export type UseSelectProps<T> = {
  options: T[];
  isDisabled: (option: T) => boolean;
};
