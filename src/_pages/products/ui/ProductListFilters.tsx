"use client";

import { useProductListSearchParams } from "../model/useProductListSearchParams";
import { SearchInput } from "@/features/search";
import { CategorySelect } from "@/features/category-select";
import { SortSelect } from "@/features/sort-select";
import styles from "./ProductListFilters.module.css";

export function ProductListFilters() {
  const { query, beginSearch, updateSearch, setFilter } =
    useProductListSearchParams();

  return (
    // 라이브 검색이라 제출로 URL 을 또 쓸 필요는 없다 — 폼 기본 새로고침만 막는다.
    <form
      className={styles.filters}
      role="search"
      onSubmit={(event) => event.preventDefault()}
    >
      <SearchInput
        searchTerm={query.q}
        onBeginSearch={beginSearch}
        onUpdateSearch={updateSearch}
      />
      <CategorySelect
        value={query.category}
        onChange={(category) => setFilter({ category })}
      />
      <SortSelect value={query.sort} onChange={(sort) => setFilter({ sort })} />
    </form>
  );
}
