import { parseNumberInput } from '../utils/parseNumberInput';

interface PriceFilterProps {
  min: number | '';
  max: number | '';
  onMinChange: (value: number | '') => void;
  onMaxChange: (value: number | '') => void;
}

/**
 * 가격 범위(최소/최대) 입력 컴포넌트
 * - 분리 기준: 인풋 이벤트의 값을 파싱하는 로직은 컴포넌트가 흡수하고, 부모에는 파싱된 값(number | '')만 전달하도록 분리하였습니다.
 * - 처음에는 디바운스를 value에 걸었다가 화면 표시가 지연되어 타이핑이 깨지는 것을 겪었고,
 *   value에는 props로 넘어온 상태를 그대로 물리고 디바운스는 fetch로 넘어가는 Page 컴포넌트에서 적용하였습니다.
 */
const PriceFilter = ({ min, max, onMinChange, onMaxChange }: PriceFilterProps) => {
  return (
    <div className="filter-group">
      <label>가격 범위</label>
      <div className="price-range">
        <input
          type="number"
          placeholder="최소"
          value={min}
          onChange={(e) => onMinChange(parseNumberInput(e.target.value))}
          min={0}
        />
        <span>~</span>
        <input
          type="number"
          placeholder="최대"
          value={max}
          onChange={(e) => onMaxChange(parseNumberInput(e.target.value))}
          min={0}
        />
      </div>
    </div>
  );
};

export default PriceFilter;
