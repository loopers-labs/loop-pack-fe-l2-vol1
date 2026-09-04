import { describe, expect, it } from 'vitest';
import { isSafeRedirect } from './isSafeRedirect';

const ORIGIN = 'http://localhost:3000';

describe('isSafeRedirect', () => {
  describe('같은 origin을 가리키는 값은 허용한다', () => {
    it('요청 origin과 완전히 같은 절대 URL을 허용한다', () => {
      expect(isSafeRedirect('http://localhost:3000/orders/new', ORIGIN)).toBe(true);
    });

    it('상대경로는 요청 origin을 기준으로 해석해 허용한다', () => {
      expect(isSafeRedirect('/mypage', ORIGIN)).toBe(true);
    });
  });

  describe('다른 origin으로 나가는 값은 차단한다', () => {
    it('외부 도메인 절대 URL을 차단한다', () => {
      expect(isSafeRedirect('https://evil.com', ORIGIN)).toBe(false);
    });

    it('프로토콜 상대 URL(//)은 base의 스킴이 붙어 외부로 나가므로 차단한다', () => {
      expect(isSafeRedirect('//evil.com', ORIGIN)).toBe(false);
    });

    it('백슬래시는 파서가 슬래시로 정규화하므로 외부 주소로 취급해 차단한다', () => {
      expect(isSafeRedirect('/\\evil.com', ORIGIN)).toBe(false);
    });

    it('호스트가 같아도 스킴이 다르면 다른 origin이므로 차단한다', () => {
      expect(isSafeRedirect('https://localhost:3000/mypage', ORIGIN)).toBe(false);
    });
  });

  describe('URL로 해석할 수 없는 값은 차단한다', () => {
    it('javascript 스킴은 origin이 일치하지 않아 차단한다', () => {
      expect(isSafeRedirect('javascript:alert(1)', ORIGIN)).toBe(false);
    });

    it('파싱에 실패하는 값은 차단한다', () => {
      expect(isSafeRedirect('http://', ORIGIN)).toBe(false);
    });
  });
});
