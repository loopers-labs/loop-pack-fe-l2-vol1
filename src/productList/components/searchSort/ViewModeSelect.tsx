import type { ViewMode } from "../../types";

/** 그리드/리스트 보기 모드 선택 드롭다운. */
export default function ViewModeSelect({
  viewMode,
  onViewModeChange,
}: {
  viewMode: ViewMode;
  onViewModeChange: (value: string) => void;
}) {
  return (
    <select value={viewMode} onChange={(e) => onViewModeChange(e.target.value)}>
      <option value="grid">그리드</option>
      <option value="list">리스트</option>
    </select>
  );
}
