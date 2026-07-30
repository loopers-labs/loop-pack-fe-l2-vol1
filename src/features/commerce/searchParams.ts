"use client";
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import type { CategoryId, ProductSort } from "@/types/commerce";

const categoryValues = [
  "all",
  "casual",
  "fashion",
  "goods",
  "home",
  "digital",
] as const satisfies readonly (CategoryId | "all")[];
const sortValues = [
  "latest",
  "popular",
  "price-asc",
  "price-desc",
] as const satisfies readonly ProductSort[];

export const categoryOptions: ReadonlyArray<{ id: CategoryId | "all"; name: string }> = [
  { id: "all", name: "전체" },
  { id: "casual", name: "캐주얼" },
  { id: "fashion", name: "패션" },
  { id: "goods", name: "뷰티·잡화" },
  { id: "home", name: "홈" },
  { id: "digital", name: "디지털" },
];

export const sortOptions: ReadonlyArray<{ id: ProductSort; name: string }> = [
  { id: "latest", name: "최신순" },
  { id: "popular", name: "인기순" },
  { id: "price-asc", name: "낮은 가격순" },
  { id: "price-desc", name: "높은 가격순" },
];

// <select> onChange의 string을 리터럴 유니온으로 좁힌다(as 대신 가드).
export const isCategoryValue = (value: string): value is CategoryId | "all" =>
  categoryValues.some((category) => category === value);

export const isSortValue = (value: string): value is ProductSort =>
  sortValues.some((sort) => sort === value);

const productListParsers = {
  q: parseAsString.withDefault(""),
  category: parseAsStringLiteral(categoryValues).withDefault("all"),
  sort: parseAsStringLiteral(sortValues).withDefault("latest"),
  page: parseAsInteger.withDefault(1),
};

// history:"push" — 각 변경을 히스토리에 쌓아 앞뒤 이동으로 복원 가능하게.
export function useProductListQuery() {
  return useQueryStates(productListParsers, { history: "push" });
}
