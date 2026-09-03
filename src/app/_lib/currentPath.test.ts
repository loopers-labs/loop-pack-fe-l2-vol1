import { describe, expect, it } from 'vitest';
import { readSingleParam, toCurrentPath } from './currentPath';
import { safeRedirectPath } from '@/shared/lib/safeRedirectPath';

describe('toCurrentPath', () => {
  it('검색 파라미터가 없으면 경로만 돌려준다', () => {
    expect(toCurrentPath('/orders', {})).toBe('/orders');
  });

  it('문자열 값을 쿼리로 붙인다', () => {
    expect(toCurrentPath('/orders/new', { from: 'cart' })).toBe('/orders/new?from=cart');
  });

  it('여러 파라미터를 받은 순서대로 붙인다', () => {
    expect(toCurrentPath('/orders/new', { from: 'cart', step: '2' })).toBe(
      '/orders/new?from=cart&step=2',
    );
  });

  // 같은 이름이 여러 번 온 경우를 하나로 합치면 원래 요청과 다른 경로로 돌려보내게 된다
  it('배열 값은 같은 이름을 반복해 유지한다', () => {
    expect(toCurrentPath('/orders', { tag: ['a', 'b'] })).toBe('/orders?tag=a&tag=b');
  });

  it('값이 없는 파라미터는 버린다', () => {
    expect(toCurrentPath('/orders', { from: undefined })).toBe('/orders');
    expect(toCurrentPath('/orders', { from: undefined, step: '2' })).toBe('/orders?step=2');
  });

  it('빈 배열은 쿼리를 만들지 않는다', () => {
    expect(toCurrentPath('/orders', { tag: [] })).toBe('/orders');
  });

  it('빈 문자열 값은 유지한다 — 파라미터가 있었다는 사실 자체가 조건이다', () => {
    expect(toCurrentPath('/orders', { q: '' })).toBe('/orders?q=');
  });

  it('공백과 한글과 예약문자를 인코딩한다', () => {
    expect(toCurrentPath('/products', { q: '케이블 울' })).toBe(
      '/products?q=%EC%BC%80%EC%9D%B4%EB%B8%94+%EC%9A%B8',
    );
    expect(toCurrentPath('/orders', { q: 'a&b=c' })).toBe('/orders?q=a%26b%3Dc');
  });

  // 실제 흐름은 requireSession → buildLoginPath → safeRedirectPath 순으로 이 값을 다시 검사한다
  it('만들어낸 경로는 복원 경로 검증을 그대로 통과한다', () => {
    const target = toCurrentPath('/orders/new', { from: 'cart', step: '2' });

    expect(safeRedirectPath(target)).toBe(target);
  });
});

describe('readSingleParam', () => {
  it('문자열이면 그대로 돌려준다', () => {
    expect(readSingleParam('/orders')).toBe('/orders');
    expect(readSingleParam('')).toBe('');
  });

  // ?next=a&next=b 로 검증을 흔들 수 있어 배열은 신뢰하지 않는다
  it('배열과 없음은 null로 돌려준다', () => {
    expect(readSingleParam(['/orders', '//example.com'])).toBeNull();
    expect(readSingleParam([])).toBeNull();
    expect(readSingleParam(undefined)).toBeNull();
  });
});
