export type ViewMode = 'grid' | 'list';

interface ViewModeToggleProps {
  value: ViewMode;
  onViewModeChange: (viewMode: ViewMode) => void;
}

/**
 * 그리드/리스트 보기 모드 선택 컴포넌트
 * - 분리 기준: viewMode는 서버로 가는 조회 조건이 아니라 화면 표시 상태라고 판단하여 SearchSortBar에서 분리하였습니다.
 *   상태의 유형이 다르다고 생각하여 컴포넌트도 이에 맞게 분리하는 것이 맞다고 판단하였습니다. SearchSortBar의 children으로 렌더링되게 하였습니다.
 */
const ViewModeToggle = ({ value, onViewModeChange }: ViewModeToggleProps) => {
  return (
    <select value={value} onChange={(e) => onViewModeChange(e.target.value as ViewMode)}>
      <option value="grid">그리드</option>
      <option value="list">리스트</option>
    </select>
  );
};

export default ViewModeToggle;
