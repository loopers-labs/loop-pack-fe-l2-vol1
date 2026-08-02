/** useSelect가 요구하는 최소 필드. 나머지 도메인 필드는 제네릭 T로 자유롭게 확장한다 */
export type SelectOptionBase = {
  id: string | number;
  disabled?: boolean;
};

/** Select(Compound)가 기본 UI를 그리는 데 필요한 옵션 형태 */
export type SelectOption = SelectOptionBase & {
  label: string;
};
