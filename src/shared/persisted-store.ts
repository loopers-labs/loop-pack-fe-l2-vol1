import { useEffect, useSyncExternalStore } from 'react';
import type { PersistStorage } from 'zustand/middleware';

/**
 * persist는 version이 숫자일 때만 비교한다.
 * 숫자가 아니면 절대 일치하지 않는 값으로 바꿔 폐기로 보낸다.
 */
const UNKNOWN_VERSION = -1;

const removeStored = (name: string) => {
  try {
    localStorage.removeItem(name);
  } catch {
    // 저장소 접근이 막힌 브라우저에서는 지울 수도 없어 스킵.
  }
};

const toStoredObject = (value: unknown) =>
  typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : undefined;

/**
 * JSON 파싱 실패, 저장소 접근 실패, 알 수 없는 version을 흡수하는 storage.
 * 저장값이 어떤 형태여야 하는지는 모른다. 형태 검증은 소유자가 validate로 넘긴다.
 *
 * currentVersion은 persist options의 version과 같은 값이어야 한다.
 * 현재 버전 저장값만 validate를 거치고, 과거 버전은 원본 그대로 migrate에 넘겨
 * 각 버전의 형태 지식을 validate(현재)와 migrate(과거) 한 곳씩에만 둔다.
 */
export const createValidatedStorage = <T>(
  currentVersion: number,
  validate: (stored: Record<string, unknown> | undefined) => T,
): PersistStorage<T> => ({
  getItem: (name) => {
    try {
      const raw = localStorage.getItem(name);

      if (raw === null) return null;

      const { state, version } = JSON.parse(raw);
      const storedVersion =
        typeof version === 'number' ? version : UNKNOWN_VERSION;

      return {
        // 버전이 다르면 persist가 반드시 migrate를 거치므로 미검증 원본이 그대로 복원되지는 않는다.
        state:
          storedVersion === currentVersion
            ? validate(toStoredObject(state))
            : state,
        version: storedVersion,
      };
    } catch {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `저장된 상태를 읽지 못해 초기 상태로 시작합니다. (${name})`,
        );
      }
      removeStored(name);

      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, JSON.stringify(value));
    } catch {
      // 실패해도 화면 동작을 막지 않음.
    }
  },
  removeItem: removeStored,
});

/** 무엇을 담고 있는지는 몰라도 되고, 복원 시점만 알면 된다 */
type RestorableStore = {
  persist: {
    rehydrate: () => Promise<void> | void;
    hasHydrated: () => boolean;
    onFinishHydration: (listener: () => void) => () => void;
  };
};

/**
 * skipHydration을 쓴 store의 복원을 시작한다.
 * 서버 HTML과 같은 빈 상태로 첫 렌더를 마친 뒤에 저장값을 읽는다.
 */
export const useRestoreStore = (store: RestorableStore) => {
  useEffect(() => {
    void store.persist.rehydrate();
  }, [store]);
};

/**
 * 복원이 끝났는지 여부. 복원 전에는 false이고, 저장값을 아직 모른다는 뜻이다.
 *
 * 공식 문서의 useHydration 예제는 useState와 useEffect를 쓰지만,
 * 그러면 첫 렌더가 항상 false로 한 번 더 돌고 이미 복원이 끝난 뒤 마운트한
 * 컴포넌트도 false부터 시작한다. persist가 구독과 현재값을 모두 주므로
 * useSyncExternalStore로 바로 읽는다.
 */
export const useStoreRestored = (store: RestorableStore) =>
  useSyncExternalStore(
    store.persist.onFinishHydration,
    store.persist.hasHydrated,
    () => false,
  );
