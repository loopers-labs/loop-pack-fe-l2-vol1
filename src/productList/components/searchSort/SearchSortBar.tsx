import type { SortBy, ViewMode } from "../../types";
import SearchInput from "./SearchInput";
import SortSelect from "./SortSelect";
import ViewModeSelect from "./ViewModeSelect";

/** 검색·정렬·보기 모드 컨트롤을 배치하는 상단 바. */
export default function SearchSortBar({
  searchQuery,
  sortBy,
  viewMode,
  onSearchChange,
  onSortChange,
  onViewModeChange,
}: {
  searchQuery: string;
  sortBy: SortBy;
  viewMode: ViewMode;
  onSearchChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onViewModeChange: (value: string) => void;
}) {
  return (
    <section className="search-sort">
      <SearchInput searchQuery={searchQuery} onSearchChange={onSearchChange} />
      <SortSelect sortBy={sortBy} onSortChange={onSortChange} />
      <ViewModeSelect viewMode={viewMode} onViewModeChange={onViewModeChange} />
    </section>
  );
}
