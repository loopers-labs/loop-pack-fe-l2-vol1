import { createParser, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";

import type { CategoryId } from "@/entities/product";
import { PRODUCT_SORTS } from "../api/products";
import type { ProductSort } from "../api/types";

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

// route.ts:47의 두 조건(isPositiveInteger·Number.isSafeInteger(page))과 정합되는
// 클램프. 앞쪽 숫자열을 취하되(2abc→2), (1) 그 숫자열 자체가 선행 0 없는 양의 정수
// 형태가 아니거나(01·1e3의 "e" 앞부분은 통과하지만 0·01은 거부) (2) 안전 정수 범위를
// 벗어나면(MAX_SAFE_INTEGER+2처럼 route가 400으로 거부하는 값) 1로 되돌린다.
// 두 번째 조건이 없으면 route가 거부하는 큰 값을 상태로 들여보내 회복 불가능한
// 에러 화면(재시도 버튼만 있고 탈출 경로가 없는 분기)을 연다.
// parseAsInteger는 "0"·"-1"을 그대로 통과시켜 route가 400으로 거부하는 값을 상태로
// 들여보내므로 쓸 수 없다.
const isValidPageValue = (value: string): boolean => {
  const leadingDigits = /^\d+/.exec(value)?.[0] ?? "";
  const parsed = Number(leadingDigits);
  return /^[1-9]\d*$/.test(leadingDigits) && Number.isSafeInteger(parsed);
};

const parsePageValue = (value: string): number => {
  const leadingDigits = /^\d+/.exec(value)?.[0] ?? "";
  return isValidPageValue(value) ? Number(leadingDigits) : 1;
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

const hasInvalidOwnedQuery = (searchParams: URLSearchParams): boolean => {
  const category = searchParams.get("category");
  const sort = searchParams.get("sort");
  const page = searchParams.get("page");

  return (
    (category !== null && LIST_QUERY_PARSERS.category.parse(category) === null) ||
    (sort !== null && LIST_QUERY_PARSERS.sort.parse(sort) === null) ||
    (page !== null && !isValidPageValue(page))
  );
};

// page 리셋은 호출자 규약이 아니라 훅 내부 불변식이다(C9b) — list-filter-bar가
// setQuery({ q })만 불러도 리셋이 지켜지도록, q·category·sort 중 하나라도 partial에
// "있으면"(값이 이전과 같아도) 아래 삼항식이 page를 1로 되돌려 같은 호출에 함께
// 넣는다. 값 비교가 아니라 키 존재 판정이다 — "검색·필터를 제출하면 1페이지부터
// 다시 본다"가 의도된 동작이라, 값이 바뀌었는지를 훅이 따지면 "같은 검색어를
// 다시 제출했는데 5페이지에 머문다"가 되어 제출의 의미가 흐려진다. 두 번 나눠
// 호출하면 히스토리 엔트리가 2개 생겨 뒤로가기가 조건 하나를 되돌리는 데 두 번
// 눌러야 한다.
// 이 리셋과 아래 no-op 가드는 역할이 다르다 — 여기는 "제출했으면 1페이지부터"를
// 강제하는 반면, no-op 가드가 막는 것은 이 리셋이 반영된 이후에도 최종 4필드가
// 현재 query와 전부 같을 때(예: page=1에서 같은 검색어 재제출)의 히스토리 오염이다.
export function useListQuery() {
  const [query, setQuery] = useQueryStates(LIST_QUERY_PARSERS);

  const setListQuery = (partial: Partial<ListQueryValues>): void => {
    const resetsPage = "q" in partial || "category" in partial || "sort" in partial;
    const next = resetsPage ? { ...partial, page: 1 } : partial;

    // no-op 가드(docs/react/url-state.md:14, :44) — nuqs는 값 비교 없이 무조건
    // history.pushState를 큐에 넣으므로(C4), 병합 후 최종 4필드가 현재 query와
    // 같으면 여기서 막아야 한다. 4필드 전부 원시값이라 얕은 필드별 비교로 충분하다.
    const merged: ListQueryValues = { ...query, ...next };
    const isNoop =
      merged.q === query.q &&
      merged.category === query.category &&
      merged.sort === query.sort &&
      merged.page === query.page;
    if (isNoop) {
      // 반환값을 쓰는 호출자가 없다(list-filter-bar·list-pagination 전부 무시한다).
      // setQuery의 Promise<URLSearchParams> 시그니처를 흉내 내려면 "쓰기 후 URL"을
      // 만들어야 하는데, NuqsTestingAdapter(hasMemory:true) 아래서는 실제 URL이 아니라
      // 메모리에만 있어 window.location.search가 비어 있고, nuqs 스로틀 창 안에서는
      // 아직 갱신 전이라 둘 다 참이 아닌 값을 돌려주게 된다 — 아무도 안 쓰는 값을
      // 거짓말로 채우느니 반환하지 않는다.
      return;
    }

    void setQuery(next);
  };

  const resetListQuery = (): void => {
    const defaults = {
      q: LIST_QUERY_PARSERS.q.defaultValue,
      category: LIST_QUERY_PARSERS.category.defaultValue,
      sort: LIST_QUERY_PARSERS.sort.defaultValue,
      page: LIST_QUERY_PARSERS.page.defaultValue,
    };

    // 파서는 스키마 밖 값을 기본값으로 복구한다. 따라서 `?category=bogus&page=0`은
    // query만 보면 이미 기본값이라 no-op처럼 보이지만, 주소창에는 잘못된 값이 남아
    // 있다. 반면 `?q=&category=all&sort=latest&page=1`은 모든 raw 값이 유효하므로
    // setListQuery의 병합 no-op에 맡긴다. literal은 해당 nuqs parser로, page는 그
    // parser가 기본값으로 바꾸기 전 validator로 원본 값을 판별한다.
    const searchParams =
      typeof window === "undefined" ? null : new URLSearchParams(window.location.search);
    if (searchParams !== null && hasInvalidOwnedQuery(searchParams)) {
      void setQuery(defaults);
      return;
    }

    setListQuery(defaults);
  };

  return [query, setListQuery, resetListQuery] as const;
}
