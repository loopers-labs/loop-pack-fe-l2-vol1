import { describe, expect, it } from 'vitest';
import {
  GUEST_CART_OWNER,
  getCartOwnerKey,
  getCartStorageKey,
  isCartOwnerKey,
} from './cartOwner';

describe('cartOwner', () => {
  it('로그인 사용자가 없으면 guest owner를 반환한다', () => {
    expect(getCartOwnerKey()).toBe(GUEST_CART_OWNER);
    expect(getCartOwnerKey('   ')).toBe(GUEST_CART_OWNER);
  });

  it('회원 ID를 안전하게 인코딩한 owner와 저장 키를 만든다', () => {
    const ownerKey = getCartOwnerKey(' member/1 ');

    expect(ownerKey).toBe('user:member%2F1');
    expect(getCartStorageKey(ownerKey)).toBe(
      'aesthetic-cart:user:member%2F1',
    );
  });

  it('브라우저에서 전달된 owner 신호를 런타임에 검증한다', () => {
    expect(isCartOwnerKey('guest')).toBe(true);
    expect(isCartOwnerKey('user:member-1')).toBe(true);
    expect(isCartOwnerKey('user:')).toBe(false);
    expect(isCartOwnerKey('admin:member-1')).toBe(false);
    expect(isCartOwnerKey(null)).toBe(false);
  });
});
