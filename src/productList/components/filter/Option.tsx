import { FilterGroupShell } from './FilterGroupShell';

export const Option = ({
  inStockOnly,
  onStockCheckboxToggle,
}: {
  inStockOnly: boolean;
  onStockCheckboxToggle: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
    <FilterGroupShell label="옵션">
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontWeight: 400,
          fontSize: 13,
        }}
      >
        <input type="checkbox" checked={inStockOnly} onChange={onStockCheckboxToggle} />
        재고 있는 것만
      </label>
    </FilterGroupShell>
  );
};
