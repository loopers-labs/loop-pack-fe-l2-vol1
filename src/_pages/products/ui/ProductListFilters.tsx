"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useProductListSearchParams } from "../model/useProductListSearchParams";
import {
  CATEGORY_LABELS,
  CATEGORY_VALUES,
  isCategoryValue,
  isSortValue,
  SORT_LABELS,
  SORT_VALUES,
} from "@/entities/product";
import styles from "@/components/commerce/commerce.module.css";

export const SEARCH_DEBOUNCE_MS = 300;

export function ProductListFilters() {
  const { query, beginSearch, updateSearch, setFilter } =
    useProductListSearchParams();
  const searchTerm = query.q;

  const [inputValue, setInputValue] = useState(searchTerm);

  // 현재 URL 엔트리가 '진행 중인 검색 draft'인지 여부.
  //  - false(직전 검색이 확정됐거나 외부에서 진입) → 다음 타이핑은 새 검색이므로 push(새 히스토리 엔트리).
  //  - true(이미 이 검색을 치는 중)             → 다음 타이핑은 replace(그 엔트리만 실시간 갱신).
  const [isEditingDraft, setIsEditingDraft] = useState(false);

  // 같은 라우트(/products) 안에서 URL 이 '외부에서' 바뀌면(헤더 "상품" 링크·뒤로가기) 이 컴포넌트는
  // unmount 없이 재사용돼 로컬 inputValue 가 옛 검색어로 남는다. prevSearchTerm 으로 그 변경을 감지한다.
  const [prevSearchTerm, setPrevSearchTerm] = useState(searchTerm);

  // 외부 변경일 때만(=우리 draft 가 아닐 때) 입력창을 맞추고 draft 세션을 닫는다 → 다음 타이핑이 새 검색(push)이 된다.
  // (우리 draft 로 바뀐 경우엔 inputValue.trim() === searchTerm 이라 이 블록을 건너뛴다.)
  if (searchTerm !== prevSearchTerm) {
    setPrevSearchTerm(searchTerm);

    if (inputValue.trim() !== searchTerm) {
      setInputValue(searchTerm);
      setIsEditingDraft(false);
    }
  }

  // 타이핑이 멈추면(디바운스 시간만큼 입력이 없으면) draft 세션을 닫는다 → 이어서 치면 새 검색(push)으로 잡힌다.
  // setState 는 타이머 콜백 안에서만 호출한다(effect 본문에서 직접 호출 아님 — 연쇄 렌더 방지).
  useEffect(() => {
    if (!isEditingDraft) return;

    const timer = setTimeout(
      () => setIsEditingDraft(false),
      SEARCH_DEBOUNCE_MS,
    );

    return () => clearTimeout(timer);
  }, [inputValue, isEditingDraft]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const trimmed = value.trim();

    setInputValue(value);

    // 새 검색의 첫 입력은 push 로 새 엔트리를 열고, 이후 입력은 replace 로 그 엔트리만 실시간 갱신한다.
    // (조회 자체는 ProductList 가 URL q 를 디바운스해서 멈춘 뒤에만 요청한다 — 타이핑마다 요청 X)
    if (isEditingDraft) {
      updateSearch(trimmed);
    } else {
      beginSearch(trimmed);
      setIsEditingDraft(true);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    // 라이브 검색이라 제출로 URL 을 또 쓸 필요는 없다 — 폼 기본 새로고침만 막고 draft 세션을 닫는다.
    event.preventDefault();
    setIsEditingDraft(false);
  };

  return (
    <form className={styles.filters} role="search" onSubmit={handleSubmit}>
      <label>
        검색
        <input
          type="search"
          name="q"
          value={inputValue}
          onChange={handleChange}
          placeholder="상품명 또는 브랜드"
        />
      </label>
      <label>
        카테고리
        <select
          value={query.category}
          onChange={(event) => {
            if (!isCategoryValue(event.target.value)) return;
            setFilter({ category: event.target.value });
          }}
        >
          {CATEGORY_VALUES.map((value) => (
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
            if (!isSortValue(event.target.value)) return;
            setFilter({ sort: event.target.value });
          }}
        >
          {SORT_VALUES.map((value) => (
            <option key={value} value={value}>
              {SORT_LABELS[value]}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
}
