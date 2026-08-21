import type { ProductListResponse } from "@/types/commerce";
import { sortFilterOptions, type ProductSearchState } from "./search-params";

export const buildTitle = (search: ProductSearchState) => {
  const q = search.q.trim();
  const base = q === "" ? "상품 목록" : `"${q}" 검색 결과`;
  return search.page >= 2 ? `${base} ${search.page}페이지` : base;
};

export const buildDescription = (search: ProductSearchState, result: ProductListResponse) => {
  const categoryName =
    search.category === "all"
      ? "전체"
      : (result.categories.find((category) => category.id === search.category)?.name ??
        search.category);
  const sortLabel =
    sortFilterOptions.find((option) => option.value === search.sort)?.label ?? search.sort;

  if (result.totalCount === 0) {
    return `${categoryName} 카테고리(${sortLabel}) 조건에 맞는 상품이 0개입니다. 다른 조건으로 검색해 보세요.`;
  }
  return `${categoryName} 카테고리 상품 ${result.totalCount}개를 ${sortLabel}으로 만나보세요.`;
};
