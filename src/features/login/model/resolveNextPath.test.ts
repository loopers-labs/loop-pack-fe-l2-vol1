import { describe, expect, it } from 'vitest';
import { resolveNextPath } from './resolveNextPath';

// 검증 대상: 복원 경로로 외부 주소에 튕겨나가지 않는다는 규칙 (RFC D4).
describe('resolveNextPath', () => {
  it('앱 안의 경로는 그대로 돌려준다 (쿼리·해시 포함)', () => {
    expect(resolveNextPath('/orders')).toBe('/orders');
    expect(resolveNextPath('/checkout?from=cart#top')).toBe(
      '/checkout?from=cart#top',
    );
  });

  it('값이 없거나 비어 있으면 기본 경로다', () => {
    expect(resolveNextPath(undefined)).toBe('/');
    expect(resolveNextPath('')).toBe('/');
    expect(resolveNextPath(undefined, '/products')).toBe('/products');
  });

  it('배열로 들어오면 첫 값만 본다', () => {
    expect(resolveNextPath(['/orders', 'https://evil.example'])).toBe(
      '/orders',
    );
  });

  it.each([
    'https://evil.example/orders',
    'http://evil.example',
    'evil.example',
    'orders',
    '//evil.example',
    '/\\evil.example',
    '/\\\\evil.example',
    'javascript:alert(1)',
    '/orders\\..\\evil',
    '/orders ',
    '/orders\tx',
  ])('외부 주소나 위장 경로 %j 는 기본 경로로 보낸다', (value) => {
    expect(resolveNextPath(value)).toBe('/');
  });

  it('경로 안의 콜론도 막는다 — 스킴 위장을 파싱 없이 걸러내는 대가로 기록해 둔다', () => {
    expect(resolveNextPath('/orders?next=https://evil.example')).toBe('/');
  });
});
