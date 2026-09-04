import { describe, expect, it } from 'vitest';

import {
  readOrCreateSessionId,
  toDevice,
  toLoginFailReason,
  toLoginFrom,
} from './events';

import { ApiError } from '@/shared/api-client';

describe('toDevice', () => {
  it.each([
    [0, 'mobile'],
    [767, 'mobile'],
    [768, 'tablet'],
    [1023, 'tablet'],
    [1024, 'desktop'],
    [1920, 'desktop'],
  ] as const)('viewport %ipx는 %s다', (width, device) => {
    expect(toDevice(width)).toBe(device);
  });
});

describe('toLoginFailReason', () => {
  it.each([
    [401, 'INVALID_CREDENTIALS'],
    [400, 'INVALID_REQUEST'],
    [500, 'SERVER_ERROR'],
    [404, 'UNKNOWN'],
  ] as const)('ApiError status %i은 %s로 분류한다', (status, reason) => {
    expect(toLoginFailReason(new ApiError(status, '실패'))).toBe(reason);
  });

  it('ApiError가 아닌 오류는 UNKNOWN이다', () => {
    expect(toLoginFailReason(new Error('네트워크 오류'))).toBe('UNKNOWN');
  });
});

describe('toLoginFrom', () => {
  it.each(['cart', 'my', 'orders', 'direct'] as const)(
    '허용된 출처 %s는 그대로 쓴다',
    (from) => {
      expect(toLoginFrom(from)).toBe(from);
    },
  );

  it.each([null, '', 'https://evil.example', 'checkout'])(
    '허용 밖의 값 %j은 direct로 처리한다',
    (value) => {
      expect(toLoginFrom(value)).toBe('direct');
    },
  );
});

describe('readOrCreateSessionId', () => {
  const createFakeStorage = () => {
    const store = new Map<string, string>();

    return {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
    };
  };

  it('저장된 값이 없으면 새 id를 만들어 저장한다', () => {
    const storage = createFakeStorage();

    const created = readOrCreateSessionId(storage);

    expect(created).not.toBe('');
    expect(storage.getItem('analytics_session_id')).toBe(created);
  });

  it('같은 저장소에서는 같은 id를 재사용한다', () => {
    const storage = createFakeStorage();

    const first = readOrCreateSessionId(storage);
    const second = readOrCreateSessionId(storage);

    expect(second).toBe(first);
  });

  it('서로 다른 빈 저장소에는 각각 새 id를 생성한다', () => {
    const first = readOrCreateSessionId(createFakeStorage());
    const second = readOrCreateSessionId(createFakeStorage());

    expect(second).not.toBe(first);
  });
});
