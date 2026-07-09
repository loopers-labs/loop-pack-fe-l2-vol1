interface StockFilterProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * 재고 있는 상품만 보기 토글
 * - 분리 기준: 로직이 거의 없어 분리하는 게 맞을지 고민이였습니다. 필터 패널의 컴포넌트들을 분리하다보니 혼자 따로 노는 느낌이여서
 *   일관성을 맞추기 위해 분리하였습니다. 이런 모호한 패턴이 보일 때 멘토님은 어떻게 하시는지 궁금합니다.
 */
const StockFilter = ({ checked, onChange }: StockFilterProps) => {
  return (
    <div className="filter-group">
      <label>옵션</label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 400, fontSize: 13 }}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        재고 있는 것만
      </label>
    </div>
  );
};

export default StockFilter;
