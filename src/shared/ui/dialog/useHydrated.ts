import { useSyncExternalStore } from 'react';

// 값이 변하지 않는 store라 구독할 것이 없다
const emptySubscribe = () => () => {};

// "hydration이 끝난 클라이언트인가"를 React 렌더러에서 직접 읽는다.
// getServerSnapshot은 서버와 hydration 중에, getSnapshot은 그 이후 클라이언트에서 읽힌다.
// hydration 이후의 새 마운트는 첫 렌더부터 true라 mounted state 방식의 이중 렌더가 없다.
export function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
