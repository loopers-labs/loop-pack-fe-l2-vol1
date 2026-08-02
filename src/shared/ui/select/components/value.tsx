import { useSelectContext } from '../hooks/useSelectContext';

type ValueProps = {
  /** 선택된 옵션이 없을 때 표시할 문구 */
  placeholder?: string;
};

export function Value({ placeholder = '선택하세요' }: ValueProps) {
  const { selected } = useSelectContext();

  return <span>{selected ? selected.label : placeholder}</span>;
}
