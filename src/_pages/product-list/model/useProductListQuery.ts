"use client";
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import type { CategoryId, ProductSort } from "@/entities/product";
import { categoryValues, sortValues } from "../config/options";

// URL(nuqs)에서 기본값이 채워진 뒤의 조회 조건.
// scenario는 mock API 전용 제어값이므로 사용자 상태에 포함하지 않는다.
export type ResolvedProductListQuery = {
  q: string;
  category: CategoryId | "all";
  sort: ProductSort;
  page: number;
};

const productListParsers = {
  q: parseAsString.withDefault(""),
  category: parseAsStringLiteral(categoryValues).withDefault("all"),
  sort: parseAsStringLiteral(sortValues).withDefault("latest"),
  page: parseAsInteger.withDefault(1),
};

// history:"push" — 각 변경을 히스토리에 쌓아 앞뒤 이동으로 복원 가능하게.
// 기본값과 같은 값은 nuqs가 URL에서 지운다(기준선 #7: page reset이 page=1이 아니라 제거로 보인다).
export function useProductListQuery() {
  return useQueryStates(productListParsers, { history: "push" });
}
