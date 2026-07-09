import { useEffect } from 'react';

/**
 * dep이 바뀔 때 스크롤을 최상단으로 올리는 훅
 * - 분리 기준: 상태가 바뀔 떄마다 스크롤이 올라가는 것은 여러 상태에서 발생할 수 있기 때문에 분리하였습니다.
 */
export const useScrollToTop = (dep: unknown) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [dep]);
};
