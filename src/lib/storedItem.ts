// [AI] persist로 불러온 값은 사용자 브라우저에서 변조됐거나, 옛날 스키마로 남아있을 수 있다.
// CartItem과 WishListItem이 같은 모양(id/name/price/image)이라 하나의 가드로 공용한다.
import type { CartItem, WishListItem } from '@/types/commerce';

type StoredItem = CartItem | WishListItem;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

// [AI] id/name/image는 문자열, price는 0 이상의 유한수여야 한다.
export const isStoredItem = (value: unknown): value is StoredItem =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.name === 'string' &&
  typeof value.price === 'number' &&
  Number.isFinite(value.price) &&
  value.price >= 0 &&
  typeof value.image === 'string';

// [AI] raw가 배열이 아니면 빈 배열로 폴백하고, 배열이면 통과한 항목만 살린다.
const filterStoredItems = (raw: unknown): StoredItem[] => {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isStoredItem);
};

// [AI] persist merge에서 호출: persisted가 객체가 아니면 currentState로 폴백하고,
// items 필드는 filterStoredItems로 검증을 통과한 항목만 남긴다.
// 'in' 연산자로 narrowing해 as 단언 없이 items에 안전하게 접근한다.
export const mergeStoredItems = <S extends { items: StoredItem[] }>(
  persisted: unknown,
  currentState: S
): S => {
  if (typeof persisted !== 'object' || persisted === null) {
    return currentState;
  }
  const rawItems = 'items' in persisted ? persisted.items : undefined;
  return {
    ...currentState,
    items: filterStoredItems(rawItems),
  };
};
