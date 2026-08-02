import type { SelectOptionBase } from './types';

/**
 * 옵션을 순회하면서 다음 옵션의 index를 찾음(disabled이면 건너띔: -1)
 * @param start 시작 option index
 * @param direction 1=정방향(다음), -1=역방향(이전)
 * @param options 탐색 대상 옵션 배열
 */
export function findEnabledIndex<T extends SelectOptionBase>(
  start: number,
  direction: 1 | -1,
  options: T[],
) {
  //option 요소가 없으면 -1 반환
  const total = options.length;
  if (total === 0) return -1;

  let index = start;
  for (let step = 0; step < total; step++) {
    //양수 범위로 보정 후 순환
    index = (index + direction + total) % total;
    if (!options[index].disabled) return index; //disabled이 아니면 반환
  }
  return -1; //모든 옵션이 disabled인 경우
}

/**
 * @description 옵션이 선택되었는지
 * @param option 비교 대상 옵션
 * @param selected 현재 선택된 옵션(없으면 null)
 */
export function isOptionSelected<T extends SelectOptionBase>(option: T, selected: T | null) {
  return selected !== null && option.id === selected.id;
}

/**
 * @description 옵션의 DOM id 문자열 생성
 * @param id 옵션의 id 값
 */
export function getOptionDomId(id: string | number) {
  return `select-option-${id}`;
}
