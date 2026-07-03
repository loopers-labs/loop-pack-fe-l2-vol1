// [AI 생성] 3주차 관심사 분리 — 검색/정렬/보기모드 바 (검토·수정)
import { SORT_OPTIONS } from "../constants";
import type { SortBy, ViewMode } from "../types";

type SearchSortBarProps = {
  searchQuery: string;
  sortBy: SortBy;
  viewMode: ViewMode;
  onChangeSearch: (value: string) => void;
  onChangeSort: (value: SortBy) => void;
  onChangeViewMode: (value: ViewMode) => void;
};

export function SearchSortBar({
  searchQuery,
  sortBy,
  viewMode,
  onChangeSearch,
  onChangeSort,
  onChangeViewMode,
}: SearchSortBarProps) {
  return (
    <section className="search-sort">
      <input
        type="search"
        placeholder="상품 검색..."
        value={searchQuery}
        onChange={(e) => onChangeSearch(e.target.value)}
        className="search-input"
      />
      <select
        value={sortBy}
        onChange={(e) => {
          // 문자열 → SortBy 유니온 좁히기(as 없이 옵션 목록에서 찾는다)
          const next = SORT_OPTIONS.find((o) => o.value === e.target.value);
          if (next) {
            onChangeSort(next.value);
          }
        }}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <select
        value={viewMode}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "grid" || v === "list") {
            onChangeViewMode(v);
          }
        }}
      >
        <option value="grid">그리드</option>
        <option value="list">리스트</option>
      </select>
    </section>
  );
}
