import { describe, expect, it } from 'vitest';
import { setReplacer, setReviver, toggleSetItem } from './set';

describe('상품 ID Set 순수 로직', () => {
  // Week 08 Step 2 추가 — 순수 로직 정상: 없는 상품 ID 추가와 원본 불변
  it('없는 상품 ID를 추가하고 원본 Set은 변경하지 않는다', () => {
    const original = new Set(['p1']);

    const result = toggleSetItem(original, 'p2');

    expect(result).toEqual(new Set(['p1', 'p2']));
    expect(original).toEqual(new Set(['p1']));
    expect(result).not.toBe(original);
  });

  // Week 08 Step 2 추가 — 순수 로직 정상: 기존 상품 ID 제거와 원본 불변
  it('이미 있는 상품 ID를 제거하고 원본 Set은 변경하지 않는다', () => {
    const original = new Set(['p1', 'p2']);

    const result = toggleSetItem(original, 'p2');

    expect(result).toEqual(new Set(['p1']));
    expect(original).toEqual(new Set(['p1', 'p2']));
  });

  // Week 08 Step 2 추가 — 순수 로직 정상: Set 직렬화와 복원
  it('Set을 JSON으로 저장한 뒤 같은 값과 Set 타입으로 복원한다', () => {
    const serialized = JSON.stringify({ productIds: new Set(['p1', 'p2']) }, setReplacer);

    const restored = JSON.parse(serialized, setReviver) as { productIds: Set<string> };

    expect(restored.productIds).toBeInstanceOf(Set);
    expect(restored.productIds).toEqual(new Set(['p1', 'p2']));
  });

  // Week 08 Step 2 추가 — 순수 로직 경계: 빈 Set과 Set이 아닌 값
  it('빈 Set은 빈 Set으로 복원하고 Set이 아닌 값은 변경하지 않는다', () => {
    const serialized = JSON.stringify(
      { productIds: new Set(), count: 0, label: 'cart' },
      setReplacer,
    );

    const restored = JSON.parse(serialized, setReviver) as {
      productIds: Set<unknown>;
      count: number;
      label: string;
    };

    expect(restored.productIds).toBeInstanceOf(Set);
    expect(restored.productIds.size).toBe(0);
    expect(restored.count).toBe(0);
    expect(restored.label).toBe('cart');
  });
});
