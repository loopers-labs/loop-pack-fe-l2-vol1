type NumberRangeInputProps = {
  minValue: string;
  maxValue: string;
  onMinValueChange: (value: string) => void;
  onMaxValueChange: (value: string) => void;
};

export function NumberRangeInput({
  minValue,
  maxValue,
  onMinValueChange,
  onMaxValueChange,
}: NumberRangeInputProps) {
  return (
    <div className="price-range">
      <input
        type="number"
        placeholder="최소"
        value={minValue}
        onChange={(e) => onMinValueChange(e.target.value)}
        min={0}
      />
      <span>~</span>
      <input
        type="number"
        placeholder="최대"
        value={maxValue}
        onChange={(e) => onMaxValueChange(e.target.value)}
        min={0}
      />
    </div>
  );
}
