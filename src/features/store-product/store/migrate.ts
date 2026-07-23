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

// [AI] persist migrate에서 호출: 저장된 버전과 현재 버전이 다를 때 실행된다.
// fromVersion에 상관없이 items를 필드별로 검증해 통과한 항목만 남긴다(브라우저 변조/스키마 드리프트 방지).
// 반환값은 persisted state로, 이후 기본 merge가 currentState와 얕게 합친다(함수 등은 currentState 유지).
// 'in' 연산자로 narrowing해 items에 안전하게 접근한다.
export const migrateStoredItems = (
  persisted: unknown,
  fromVersion: number
): { items: StoredItem[] } => {
  void fromVersion;
  const rawItems = isRecord(persisted) && 'items' in persisted ? persisted.items : undefined;
  return { items: filterStoredItems(rawItems) };
};
