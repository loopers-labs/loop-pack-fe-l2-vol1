/** id가 없으면 끝에 추가하고, 있으면 제거한다(중복 없음). 위시리스트 토글용. */
export function toggleId(ids: readonly number[], id: number): number[] {
  return ids.includes(id) ? ids.filter((existing) => existing !== id) : [...ids, id];
}

/** id를 맨 앞으로 옮기고(중복 제거) max 길이로 자른다. 최근 본 상품 목록용. */
export function addRecentId(ids: readonly number[], id: number, max = 10): number[] {
  const without = ids.filter((existing) => existing !== id);
  return [id, ...without].slice(0, max);
}
