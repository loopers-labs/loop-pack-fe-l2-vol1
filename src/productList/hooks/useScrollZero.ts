import { useEffect } from 'react';

export const useScrollZero = <T>(dep: T) => {
  // ─── 페이지가 바뀔 때 스크롤 맨 위로 ────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [dep]);
};
