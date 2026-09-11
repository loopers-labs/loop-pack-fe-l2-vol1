import { describe, expect, it } from 'vitest';
import { isExpiredScenario } from './auth-cookies';

describe('isExpiredScenario', () => {
  it.each([
    ['expired', true],
    [undefined, false],
    ['invalid', false],
    ['error', false],
    ['slow', false],
    ['', false],
  ] as const)('scenario=%s -> %s', (value, expected) => {
    expect(isExpiredScenario(value)).toBe(expected);
  });
});
