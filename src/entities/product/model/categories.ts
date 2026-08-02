import type { CategoryId } from "./types";

const CATEGORY_IDS = [
  "casual",
  "fashion",
  "goods",
  "home",
  "digital",
] as const satisfies readonly CategoryId[];

export const isCategoryId = (value: string): value is CategoryId =>
  CATEGORY_IDS.some((categoryId) => categoryId === value);
