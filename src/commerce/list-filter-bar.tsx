import { useState } from "react";

import { isCategoryId, PRODUCT_SORTS, isProductSort } from "./api/products";
import type { ProductSort } from "./api/types";
import styles from "./commerce.module.css";
import { CATEGORY_FILTER_VALUES } from "./use-list-query";
import type { useListQuery } from "./use-list-query";

// use-list-query.ts가 ListQueryValues를 export하지 않으므로(내부 구현 세부),
// 훅의 실제 반환 튜플에서 값/setter 타입을 그대로 뽑아 쓴다 — 타입을 여기서
// 다시 손으로 베끼면 훅 시그니처가 바뀔 때 두 곳을 따로 고쳐야 한다.
type ListQuery = ReturnType<typeof useListQuery>[0];
type SetListQuery = ReturnType<typeof useListQuery>[1];

const CATEGORY_LABELS = {
  all: "전체",
  casual: "캐주얼",
  fashion: "패션",
  goods: "뷰티·잡화",
  home: "홈",
  digital: "디지털",
} as const satisfies Record<(typeof CATEGORY_FILTER_VALUES)[number], string>;

const SORT_LABELS = {
  latest: "최신순",
  popular: "인기순",
  "price-asc": "가격 낮은순",
  "price-desc": "가격 높은순",
} as const satisfies Record<ProductSort, string>;

const isCategoryFilterValue = (value: string): value is (typeof CATEGORY_FILTER_VALUES)[number] =>
  value === "all" || isCategoryId(value);

type ListFilterBarProps = {
  query: ListQuery;
  setQuery: SetListQuery;
};

export function ListFilterBar({ query, setQuery }: ListFilterBarProps) {
  return (
    <div className={styles.filters}>
      <SearchInput key={query.q} initialQ={query.q} onSubmit={(q) => setQuery({ q })} />
      <label>
        카테고리
        <select
          value={query.category}
          onChange={(event) => {
            const { value } = event.target;
            if (isCategoryFilterValue(value)) {
              setQuery({ category: value });
            }
          }}
        >
          {CATEGORY_FILTER_VALUES.map((value) => (
            <option key={value} value={value}>
              {CATEGORY_LABELS[value]}
            </option>
          ))}
        </select>
      </label>
      <label>
        정렬
        <select
          value={query.sort}
          onChange={(event) => {
            const { value } = event.target;
            if (isProductSort(value)) {
              setQuery({ sort: value });
            }
          }}
        >
          {PRODUCT_SORTS.map((sort) => (
            <option key={sort} value={sort}>
              {SORT_LABELS[sort]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function SearchInput({ initialQ, onSubmit }: { initialQ: string; onSubmit: (q: string) => void }) {
  const [draft, setDraft] = useState(initialQ);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(draft);
      }}
    >
      <label>
        검색
        <input
          name="q"
          placeholder="상품명 또는 브랜드"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
      </label>
    </form>
  );
}
