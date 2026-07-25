import { createParser, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";

import { PRODUCT_SORTS } from "./api/products";
import type { CategoryId, ProductSort } from "./api/types";

// 목록 요청의 기본 페이지 크기. route.ts가 pageSize<=24를 강제하고 기본값도 12다.
export const PAGE_SIZE = 12;

// category 파서가 허용하는 값 — 카테고리 필터 UI의 "all" 옵션까지 포함한다.
export const CATEGORY_FILTER_VALUES = [
  "all",
  "casual",
  "fashion",
  "goods",
  "home",
  "digital",
] as const satisfies readonly (CategoryId | "all")[];

// 소진성 가드: CATEGORY_FILTER_VALUES에서 CategoryId 멤버가 하나라도 빠지면
// Exclude<...>가 그 멤버를 담은 타입을 만들고, _AssertNever<T extends never>가
// 그 타입을 받아들이지 못해 TS2344로 빠진 멤버 이름을 지목한다.
// satisfies만으로는 방향이 반대(허위 값 추가)만 잡히므로 이 가드가 별도로 필요하다.
type _AssertNever<T extends never> = T;
type _CategoryCoverage = _AssertNever<Exclude<CategoryId, (typeof CATEGORY_FILTER_VALUES)[number]>>;

// route.ts:19의 /^[1-9]\d*$/와 정합되는 클램프: 앞쪽 숫자열을 취하되(2abc→2),
// 그 숫자열 자체가 선행 0 없는 양의 정수 형태가 아니면(01·1e3의 "e" 앞부분은 통과하지만
// 0·01은 거부) 1로 되돌린다. parseAsInteger는 "0"·"-1"을 그대로 통과시켜 route가
// 400으로 거부하는 값을 상태로 들여보내므로 쓸 수 없다.
const parsePageValue = (value: string): number => {
  const leadingDigits = /^\d+/.exec(value)?.[0] ?? "";
  return /^[1-9]\d*$/.test(leadingDigits) ? Number(leadingDigits) : 1;
};

export const pageParser = createParser<number>({
  parse: parsePageValue,
  serialize: (value) => String(value),
}).withDefault(1);

// nuqs가 매 렌더 재구독하지 않도록 파서 맵은 모듈 스코프 상수로 한 번만 만든다.
// 과제 요구(docs/assignments/week-05.md:41)에 따라 4개 파라미터 모두 history: "push" —
// 각 변경이 앞뒤 이동에서 개별적으로 복원되게 한다.
export const LIST_QUERY_PARSERS = {
  q: parseAsString.withDefault("").withOptions({ history: "push" }),
  category: parseAsStringLiteral(CATEGORY_FILTER_VALUES)
    .withDefault("all")
    .withOptions({ history: "push" }),
  sort: parseAsStringLiteral(PRODUCT_SORTS).withDefault("latest").withOptions({ history: "push" }),
  page: pageParser.withOptions({ history: "push" }),
};

type ListQueryValues = {
  q: string;
  category: CategoryId | "all";
  sort: ProductSort;
  page: number;
};

// page 리셋은 호출자 규약이 아니라 훅 내부 불변식이다(C9b) — list-filter-bar가
// setQuery({ q })만 불러도 리셋이 지켜지도록, q·category·sort 중 하나라도 바뀌면
// 아래 삼항식이 page를 1로 되돌려 같은 호출에 함께 넣는다. 두 번 나눠 호출하면
// 히스토리 엔트리가 2개 생겨 뒤로가기가 조건 하나를 되돌리는 데 두 번 눌러야 한다.
export function useListQuery() {
  const [query, setQuery] = useQueryStates(LIST_QUERY_PARSERS);

  const setListQuery = (partial: Partial<ListQueryValues>) => {
    const resetsPage = "q" in partial || "category" in partial || "sort" in partial;
    return setQuery(resetsPage ? { ...partial, page: 1 } : partial);
  };

  return [query, setListQuery] as const;
}
