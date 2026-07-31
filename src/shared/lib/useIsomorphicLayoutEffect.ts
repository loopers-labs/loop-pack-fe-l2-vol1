import { useEffect, useLayoutEffect } from 'react';

// Next.js(SSR) 환경에서 useLayoutEffect를 사용하면
// "useLayoutEffect does nothing on the server..." 경고가 출력된다.
// 서버에서는 useEffect, 클라이언트에서는 useLayoutEffect를 쓰도록 분기한다. (AI 활용)
// window 존재 여부로 SSR/CSR 을 판별한다.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export { useIsomorphicLayoutEffect };
