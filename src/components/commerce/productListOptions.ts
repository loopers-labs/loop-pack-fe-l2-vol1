import type { CategoryId, ProductSort } from "@/types/commerce";

export const CATEGORY_VALUES = [
  "all",
  "casual",
  "fashion",
  "goods",
  "home",
  "digital",
] as const satisfies readonly (CategoryId | "all")[];

export const SORT_VALUES = [
  "latest",
  "popular",
  "price-asc",
  "price-desc",
] as const satisfies readonly ProductSort[];

export const CATEGORY_LABELS: Record<(typeof CATEGORY_VALUES)[number], string> =
  {
    all: "전체",
    casual: "캐주얼",
    fashion: "패션",
    goods: "뷰티·잡화",
    home: "홈",
    digital: "디지털",
  };

export const SORT_LABELS: Record<ProductSort, string> = {
  latest: "최신순",
  popular: "인기순",
  "price-asc": "낮은 가격순",
  "price-desc": "높은 가격순",
};

// select의 onChange 값(string)을 타입 단언 없이 좁히기 위한 가드
export function isCategoryValue(value: string): value is CategoryId | "all" {
  return CATEGORY_VALUES.some((category) => category === value);
}

export function isSortValue(value: string): value is ProductSort {
  return SORT_VALUES.some((sort) => sort === value);
}
