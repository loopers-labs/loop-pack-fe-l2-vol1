// [AI] buildQueryString 단위 테스트 (week-08 2단계, 항목 3).
// 이 함수는 모든 API 요청 URL을 조립하는 유일한 통로(chokepoint)라
// undefined 스킵 / 빈 입력 / 직렬화 계약이 깨지면 폭발 반경이 넓다.
// DOM·네트워크 없이 검증하는 순수 로직이므로 .ts 확장자로 node 환경에서 돌린다.
import { describe, it, expect } from 'vitest';
import { buildQueryString } from './fetcher';

describe('buildQueryString', () => {
  it('query가 undefined면 빈 문자열을 반환한다', () => {
    expect(buildQueryString(undefined)).toBe('');
  });

  it('query가 빈 객체면 ?를 붙이지 않고 빈 문자열을 반환한다', () => {
    expect(buildQueryString({})).toBe('');
  });

  it('undefined 값을 가진 항목은 쿼리에서 스킵한다 (?key=undefined 가 박히지 않는다)', () => {
    const result = buildQueryString({
      category: 'fashion',
      page: undefined,
      sort: 'latest',
    });
    expect(result).toBe('?category=fashion&sort=latest');
    expect(result).not.toContain('undefined');
  });

  it('모든 값이 undefined면 빈 문자열을 반환한다', () => {
    expect(buildQueryString({ category: undefined, sort: undefined })).toBe('');
  });

  it('문자열·숫자 값을 ?key=value&key2=value2 형태로 직렬화한다', () => {
    expect(buildQueryString({ category: 'fashion', page: 1 })).toBe('?category=fashion&page=1');
  });
});
