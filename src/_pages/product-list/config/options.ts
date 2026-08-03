import type { CategoryId, ProductSort } from "@/entities/product/model/types";

export const categoryValues = [
  "all",
  "casual",
  "fashion",
  "goods",
  "home",
  "digital",
] as const satisfies readonly (CategoryId | "all")[];

export const sortValues = [
  "latest",
  "popular",
  "price-asc",
  "price-desc",
] as const satisfies readonly ProductSort[];

// 화면에 그릴 필터 옵션 — 목록 페이지에서만 쓰므로 이 슬라이스가 소유한다.
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
