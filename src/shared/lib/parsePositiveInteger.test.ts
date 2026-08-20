import { describe, expect, it } from 'vitest';
import { parsePositiveInteger } from './parsePositiveInteger';

describe('parsePositiveInteger', () => {
  it.each([
    ['1', 1],
    ['10', 10],
    [String(Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER],
  ])('%s를 안전한 양의 정수 %d로 변환합니다', (value, expected) => {
    expect(parsePositiveInteger(value)).toBe(expected);
  });

  it.each([
    '',
    '0',
    '-1',
    '01',
    '1.5',
    '1abc',
    String(Number.MAX_SAFE_INTEGER + 1),
  ])('%s는 양의 정수로 변환하지 않습니다', (value) => {
    expect(parsePositiveInteger(value)).toBeNull();
  });
});
