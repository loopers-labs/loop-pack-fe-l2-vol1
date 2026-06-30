import { SORT_OPTIONS } from "../../constants";
import type { SortBy } from "../../types";

/** 정렬 기준 선택 드롭다운. */
export default function SortSelect({
  sortBy,
  onSortChange,
}: {
  sortBy: SortBy;
  onSortChange: (value: string) => void;
}) {
  return (
    <select value={sortBy} onChange={(e) => onSortChange(e.target.value)}>
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
