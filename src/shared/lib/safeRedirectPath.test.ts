import { describe, expect, it } from 'vitest';
import {
  buildLoginPath,
  DEFAULT_REDIRECT_PATH,
  EXPIRED_PARAM,
  isExpiredFlag,
  safeRedirectPath,
} from './safeRedirectPath';

describe('safeRedirectPath', () => {
  it('내부 경로는 쿼리까지 그대로 돌려준다', () => {
    expect(safeRedirectPath('/orders/new')).toBe('/orders/new');
    expect(safeRedirectPath('/products?category=casual&page=2')).toBe(
      '/products?category=casual&page=2',
    );
  });

  it('값이 없으면 홈으로 보낸다', () => {
    expect(safeRedirectPath(null)).toBe(DEFAULT_REDIRECT_PATH);
    expect(safeRedirectPath(undefined)).toBe(DEFAULT_REDIRECT_PATH);
    expect(safeRedirectPath('')).toBe(DEFAULT_REDIRECT_PATH);
  });

  it('절대 URL은 홈으로 보낸다', () => {
    expect(safeRedirectPath('https://example.com')).toBe(DEFAULT_REDIRECT_PATH);
    expect(safeRedirectPath('http://example.com/orders')).toBe(DEFAULT_REDIRECT_PATH);
    expect(safeRedirectPath('javascript:alert(1)')).toBe(DEFAULT_REDIRECT_PATH);
  });

  // 앞의 '/' 하나만 보고 통과시키면 브라우저가 외부 호스트로 해석하는 형태
  it('protocol-relative 형태는 홈으로 보낸다', () => {
    expect(safeRedirectPath('//example.com')).toBe(DEFAULT_REDIRECT_PATH);
    expect(safeRedirectPath('//example.com/orders/new')).toBe(DEFAULT_REDIRECT_PATH);
    expect(safeRedirectPath('/\\example.com')).toBe(DEFAULT_REDIRECT_PATH);
    expect(safeRedirectPath('/\\\\example.com')).toBe(DEFAULT_REDIRECT_PATH);
  });

  // 브라우저가 URL 해석 전에 떼어내는 문자로 검사를 우회하지 못해야 한다
  it('앞쪽 공백·제어문자를 붙여도 우회되지 않는다', () => {
    expect(safeRedirectPath('  //example.com')).toBe(DEFAULT_REDIRECT_PATH);
    expect(safeRedirectPath('\n//example.com')).toBe(DEFAULT_REDIRECT_PATH);
    expect(safeRedirectPath('\t//example.com')).toBe(DEFAULT_REDIRECT_PATH);
    expect(safeRedirectPath('  /orders')).toBe('/orders');
  });

  it('로그인 경로로 되돌아가지 않는다', () => {
    expect(safeRedirectPath('/login')).toBe(DEFAULT_REDIRECT_PATH);
    expect(safeRedirectPath('/login?next=%2Forders')).toBe(DEFAULT_REDIRECT_PATH);
    expect(safeRedirectPath('/login/step2')).toBe(DEFAULT_REDIRECT_PATH);
  });

  it('이름이 login으로 시작할 뿐인 다른 경로는 통과시킨다', () => {
    expect(safeRedirectPath('/loginable')).toBe('/loginable');
  });
});

describe('isExpiredFlag', () => {
  it('만료를 뜻하는 값에만 참을 돌려준다', () => {
    expect(isExpiredFlag('1')).toBe(true);
  });

  // 파라미터의 존재만으로 판정하면 주소를 고쳐 넣은 값에도 만료 안내가 뜬다
  it('다른 값에는 거짓을 돌려준다', () => {
    expect(isExpiredFlag('0')).toBe(false);
    expect(isExpiredFlag('')).toBe(false);
    expect(isExpiredFlag('true')).toBe(false);
    expect(isExpiredFlag('expired')).toBe(false);
    expect(isExpiredFlag(' 1')).toBe(false);
  });

  it('값이 없으면 거짓을 돌려준다', () => {
    expect(isExpiredFlag(null)).toBe(false);
    expect(isExpiredFlag(undefined)).toBe(false);
  });
});

// 생성 측과 해석 측이 같은 계약을 쓰는지 — 한쪽만 바뀌면 여기서 깨진다
describe('buildLoginPath와 isExpiredFlag의 계약', () => {
  const readExpired = (path: string) =>
    new URL(path, 'http://localhost').searchParams.get(EXPIRED_PARAM);

  it('만료로 만든 경로는 만료로 읽힌다', () => {
    expect(isExpiredFlag(readExpired(buildLoginPath('/orders', true)))).toBe(true);
  });

  it('만료가 아닌 경로에는 파라미터 자체가 없다', () => {
    const path = buildLoginPath('/orders', false);

    expect(readExpired(path)).toBeNull();
    expect(isExpiredFlag(readExpired(path))).toBe(false);
  });
});
