// 이 포맷터의 존재 이유는 "표시 타임존이 실행 환경을 따라가지 않는 것" 하나다.
// 그 성질이 깨지면 화면이 환경마다 다른 시각을 보여주고, 기대값을 같은 식으로 만드는
// 테스트는 양쪽에서 통과해 버린다. 그래서 출력 문자열이 아니라 **환경을 바꿔도 같다**를 건다.
import { describe, expect, it } from 'vitest';

import { formatDateTime } from './format-datetime';

const inTimeZone = <T>(timeZone: string, read: () => T): T => {
  const original = process.env.TZ;
  process.env.TZ = timeZone;
  try {
    return read();
  } finally {
    process.env.TZ = original;
  }
};

const ORDERED_AT = '2026-08-30T09:00:00.000Z';

describe('formatDateTime', () => {
  it('실행 환경 타임존이 달라도 같은 문자열을 만든다', () => {
    const utc = inTimeZone('UTC', () => formatDateTime(ORDERED_AT));
    const seoul = inTimeZone('Asia/Seoul', () => formatDateTime(ORDERED_AT));
    const newYork = inTimeZone('America/New_York', () =>
      formatDateTime(ORDERED_AT),
    );

    expect(utc).toBe(seoul);
    expect(utc).toBe(newYork);
  });

  it('표시 타임존은 한국이다 — 09:00Z는 오후 06:00으로 보인다', () => {
    expect(inTimeZone('UTC', () => formatDateTime(ORDERED_AT))).toBe(
      '26. 08. 30. (일) 오후 06:00',
    );
  });
});
