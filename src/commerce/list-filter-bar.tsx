import { useCallback, useRef, useState } from "react";
import type { RefObject } from "react";

import { isCategoryId } from "@/entities/product";
import { PRODUCT_SORTS, isProductSort } from "./api/products";
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
  // 제출로 인한 key 리마운트인지(포커스 복원 필요) 최초 마운트인지(포커스 훔치면 안 됨)
  // 구별하는 플래그. 상태(state)로 안 두는 이유: 이 값 자체는 화면에 아무것도 그리지
  // 않고 SearchInput의 ref 콜백이 커밋 시점에 한 번 읽고 끄는 신호일 뿐이라
  // 리렌더를 유발할 필요가 없다 — ref가 정확히 그 용도다. 켜는 조건(q !== query.q)은
  // 끄는 조건(key={query.q} 리마운트)과 동치여야 한다 — 같은 값 재제출(no-op)에서
  // 켜면 리마운트가 없어 못 꺼지고, 다음에 폼 바깥에서 온 q 변경(뒤로가기)이 리마운트를
  // 낼 때 잔류한 플래그가 사용자가 제출하지 않은 포커스 이동을 일으킨다.
  const focusNextMountRef = useRef(false);

  return (
    <div className={styles.filters}>
      <SearchInput
        key={query.q}
        initialQ={query.q}
        focusNextMountRef={focusNextMountRef}
        onSubmit={(q) => {
          if (q !== query.q) {
            focusNextMountRef.current = true;
          }
          setQuery({ q });
        }}
      />
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

function SearchInput({
  initialQ,
  onSubmit,
  focusNextMountRef,
}: {
  initialQ: string;
  onSubmit: (q: string) => void;
  focusNextMountRef: RefObject<boolean>;
}) {
  const [draft, setDraft] = useState(initialQ);

  // 제출로 새 key의 SearchInput이 마운트될 때만(focusNextMountRef.current === true) 포커스를
  // 되돌린다 — 최초 마운트(플래그 false)는 건드리지 않는다. ref 자체를 dep으로 두면
  // (원시값이 아닌 ref 객체는 리렌더 내내 참조가 고정이므로) 이 콜백은 이 인스턴스의
  // 수명 동안 재생성되지 않아, 타이핑 등 무관한 리렌더에서 다시 불리지 않는다.
  // 커서는 끝에 둔다 — 그래야 이어서 타이핑할 때 자연스럽다(기본 focus()는 시작점에 둔다).
  const restoreFocus = useCallback(
    (node: HTMLInputElement | null) => {
      if (!node || !focusNextMountRef.current) {
        return;
      }
      focusNextMountRef.current = false;
      node.focus();
      node.setSelectionRange(node.value.length, node.value.length);
    },
    [focusNextMountRef],
  );

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
          ref={restoreFocus}
          name="q"
          placeholder="상품명 또는 브랜드"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
      </label>
    </form>
  );
}
