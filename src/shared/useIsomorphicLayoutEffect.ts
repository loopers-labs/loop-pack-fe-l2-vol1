import { useLayoutEffect } from 'react';

// 서버에서 useLayoutEffect는 경고를 내므로 no-op으로 분기한다
export const useIsomorphicLayoutEffect =
  typeof document !== 'undefined' ? useLayoutEffect : () => {};
