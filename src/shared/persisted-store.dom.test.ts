import { expect, it, vi } from 'vitest';

import { createValidatedStorage } from './persisted-store';

const STORAGE_KEY = 'persisted-store-test';

/** 형태 검증은 소유자 몫이므로, 여기서는 배관에 무엇이 전달되는지만 본다 */
const passthroughStorage = () => {
  const validate = vi.fn((stored: Record<string, unknown> | undefined) => ({
    value: stored?.value,
  }));

  return { storage: createValidatedStorage(validate), validate };
};

const save = (stored: unknown) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

it('저장값을 validate에 넘기고 그 결과를 복원 상태로 쓴다', () => {
  const { storage, validate } = passthroughStorage();
  save({ state: { value: 'saved' }, version: 3 });

  expect(storage.getItem(STORAGE_KEY)).toEqual({
    state: { value: 'saved' },
    version: 3,
  });
  expect(validate).toHaveBeenCalledWith({ value: 'saved' });
});

it('저장된 게 없으면 null을 준다', () => {
  const { storage } = passthroughStorage();

  expect(storage.getItem(STORAGE_KEY)).toBeNull();
});

it.each([
  ['version이 숫자가 아니면', { state: {}, version: '1' }],
  ['version이 없으면', { state: {} }],
])('%s 어떤 version과도 일치하지 않는 값으로 바꾼다', async (_, stored) => {
  const { storage } = passthroughStorage();
  save(stored);

  // persist는 이 값이 현재 version과 다르므로 migrate로 보내 폐기한다
  expect((await storage.getItem(STORAGE_KEY))?.version).toBe(-1);
});

it('state가 객체가 아니면 validate에 undefined를 넘긴다', async () => {
  const { storage, validate } = passthroughStorage();
  save({ state: 'broken', version: 1 });

  await storage.getItem(STORAGE_KEY);

  expect(validate).toHaveBeenCalledWith(undefined);
});

it('JSON이 아니면 저장값을 지우고 초기 상태로 시작한다', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const { storage } = passthroughStorage();
  localStorage.setItem(STORAGE_KEY, '{{{');

  expect(storage.getItem(STORAGE_KEY)).toBeNull();
  expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  expect(warn).toHaveBeenCalled();
});

it('저장소 읽기가 막혀도 초기 상태로 시작한다', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('저장소를 쓸 수 없습니다');
  });
  const { storage } = passthroughStorage();

  expect(storage.getItem(STORAGE_KEY)).toBeNull();
  expect(warn).toHaveBeenCalled();
});

it('저장소 쓰기가 막혀도 화면 동작을 막지 않는다', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('저장소를 쓸 수 없습니다');
  });
  const { storage } = passthroughStorage();

  expect(() => {
    storage.setItem(STORAGE_KEY, { state: { value: 'x' }, version: 1 });
  }).not.toThrow();
});
