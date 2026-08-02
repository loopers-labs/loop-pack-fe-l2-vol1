import { useSelect } from './useSelect';
import type { SelectOption } from '../types';

export type UseSelectRootParams = {
  /** 선택 가능한 옵션 목록 */
  options: SelectOption[];
  /** controlled 선택값 */
  value?: SelectOption | null;
  /** uncontrolled 초기 선택값 */
  defaultValue?: SelectOption | null;
  /** 선택 시 호출, 옵션 객체 전체를 그대로 돌려준다 */
  onChange?: (option: SelectOption) => void;
};

/* AI-generated */
export function useSelectRoot({ options, value, defaultValue, onChange }: UseSelectRootParams) {
  return useSelect<SelectOption>({ options, value, defaultValue, onChange });
}
