import { describe, expect, it } from 'vitest';
import { resolveLoginDestination } from './resolveLoginDestination';

const ORIGIN = 'http://localhost:3000';

describe('resolveLoginDestination', () => {
  describe('같은 origin이면 경로만 남겨 돌려준다', () => {
    it('proxy가 만든 절대 URL에서 경로를 잘라낸다', () => {
      expect(resolveLoginDestination('http://localhost:3000/orders/new', ORIGIN)).toBe('/orders/new');
    });

    it('쿼리스트링과 해시를 함께 남겨 URL 상태까지 복원한다', () => {
      expect(resolveLoginDestination('http://localhost:3000/products?category=casual&page=2#list', ORIGIN)).toBe('/products?category=casual&page=2#list');
    });

    it('상대경로는 그대로 통과시킨다', () => {
      expect(resolveLoginDestination('/mypage', ORIGIN)).toBe('/mypage');
    });
  });

  describe('목적지로 쓸 수 없는 값은 기본 경로로 보낸다', () => {
    it('값이 없으면 기본 경로다', () => {
      expect(resolveLoginDestination(null, ORIGIN)).toBe('/');
    });

    it('빈 문자열은 origin 검증을 통과하지만 목적지가 아니므로 기본 경로다', () => {
      expect(resolveLoginDestination('', ORIGIN)).toBe('/');
    });

    it('외부 도메인은 기본 경로다', () => {
      expect(resolveLoginDestination('https://evil.com/steal', ORIGIN)).toBe('/');
    });

    it('프로토콜 상대 URL은 외부로 나가므로 기본 경로다', () => {
      expect(resolveLoginDestination('//evil.com', ORIGIN)).toBe('/');
    });
  });
});
