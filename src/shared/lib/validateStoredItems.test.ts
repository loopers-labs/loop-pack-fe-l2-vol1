// [AI] persist migrate 계약 검증 (week-06 0단계 권장 테스트).
// CartItem/WishlistItem = Pick<Product, 'id'> 이므로 저장값은 { id } 만 갖는다.
// 브라우저 변조/옛날 스키마를 걸러내되, 정상 { id } 아이템은 보존해야 한다.
import { describe, it, expect } from 'vitest';
import { isStoredItem, migrateStoredItems } from './validateStoredItems';

describe('isStoredItem', () => {
  it('id 문자열만 있는 정상 아이템을 받아들인다', () => {
    expect(isStoredItem({ id: 'p1' })).toBe(true);
  });

  it('id 가 문자열이 아니면 거른다', () => {
    expect(isStoredItem({ id: 1 })).toBe(false);
    expect(isStoredItem({ id: null })).toBe(false);
    expect(isStoredItem({})).toBe(false);
  });

  it('객체가 아니면 거른다', () => {
    expect(isStoredItem(null)).toBe(false);
    expect(isStoredItem('p1')).toBe(false);
    expect(isStoredItem(undefined)).toBe(false);
  });
});

describe('migrateStoredItems', () => {
  it('정상 아이템만 살리고 잘못된 항목은 버린다', () => {
    const persisted = {
      items: [{ id: 'p1' }, { id: 'p2' }, { id: 3 }, { bad: true }, null],
    };
    expect(migrateStoredItems(persisted, 1)).toEqual({
      items: [{ id: 'p1' }, { id: 'p2' }],
    });
  });

  it('items 가 배열이 아니면 빈 배열로 폴백한다', () => {
    expect(migrateStoredItems({ items: 'nope' }, 1)).toEqual({ items: [] });
    expect(migrateStoredItems({}, 1)).toEqual({ items: [] });
  });

  it('persisted 자체가 객체가 아니어도 안전하다', () => {
    expect(migrateStoredItems(null, 1)).toEqual({ items: [] });
    expect(migrateStoredItems(undefined, 1)).toEqual({ items: [] });
  });

  it('fromVersion 에 관계없이 동일하게 검증한다', () => {
    expect(migrateStoredItems({ items: [{ id: 'p1' }] }, 0)).toEqual({
      items: [{ id: 'p1' }],
    });
    expect(migrateStoredItems({ items: [{ id: 'p1' }] }, 99)).toEqual({
      items: [{ id: 'p1' }],
    });
  });
});
