import { describe, expect, it } from 'vitest';
import { formatDateTime } from './formatDateTime';

describe('formatDateTime', () => {
  it('UTC 값을 서울 시각으로 바꿔 보여준다', () => {
    expect(formatDateTime('2026-09-01T11:02:17.481Z')).toBe('2026-09-01 20:02');
  });

  // 날짜가 넘어가는 경계 — UTC로는 8월 31일이지만 서울에서는 9월 1일이다
  it('타임존 때문에 날짜가 넘어가는 값도 서울 기준으로 보여준다', () => {
    expect(formatDateTime('2026-08-31T15:00:00.000Z')).toBe('2026-09-01 00:00');
  });

  it('자정과 정오를 24시간 표기로 보여준다', () => {
    expect(formatDateTime('2026-09-01T15:00:00.000Z')).toBe('2026-09-02 00:00');
    expect(formatDateTime('2026-09-01T03:00:00.000Z')).toBe('2026-09-01 12:00');
  });

  it('월과 일을 두 자리로 채운다', () => {
    expect(formatDateTime('2026-01-02T00:00:00.000Z')).toBe('2026-01-02 09:00');
  });

  // 실행 환경의 타임존이 무엇이든 같은 문자열이 나와야 한다
  it('시스템 타임존이 달라도 결과가 같다', () => {
    const original = process.env.TZ;
    const iso = '2026-09-01T11:02:17.481Z';

    process.env.TZ = 'UTC';
    const inUtc = formatDateTime(iso);
    process.env.TZ = 'America/New_York';
    const inNewYork = formatDateTime(iso);
    process.env.TZ = original;

    expect(inUtc).toBe('2026-09-01 20:02');
    expect(inNewYork).toBe(inUtc);
  });

  it('읽을 수 없는 값은 원문을 그대로 돌려준다', () => {
    expect(formatDateTime('')).toBe('');
    expect(formatDateTime('어제')).toBe('어제');
  });
});
