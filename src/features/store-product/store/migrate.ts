// [AI] persist로 불러온 값은 사용자 브라우저에서 변조됐거나, 옛날 스키마로 남아있을 수 있다.
// CartItem/WishlistItem = Pick<Product, 'id'> 이므로 저장값은 { id } 만 갖는다.
// id 가 비어있지 않은 문자열인지 검증해 변조/옛날 스키마를 걸러낸다.
import type { CartItem, WishlistItem } from '@/types/commerce';

type StoredItem = CartItem | WishlistItem;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

// [AI] id 가 비어있지 않은 문자열이면 정상 아이템으로 본다.
// (이전엔 name/price/image 도 요구했으나, 저장값은 { id } 뿐이라 버전 업그레이드 시
//  migrate가 모든 아이템을 지워버리는 잠재 결함이었다. 저장 shape에 맞게 id만 검증한다.)
export const isStoredItem = (value: unknown): value is StoredItem =>
  isRecord(value) && typeof value.id === 'string' && value.id.length > 0;

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
