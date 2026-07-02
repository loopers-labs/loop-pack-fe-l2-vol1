import { useCallback, useSyncExternalStore } from 'react';

// 불필요한 state를 줄이고 URL을 SOT로 갖자는 아이디어가 바탕
// 코드만 AI로 작성
const subscribe = (onChange: () => void) => {
  window.addEventListener('popstate', onChange);
  return () => window.removeEventListener('popstate', onChange);
};

const getSnapshot = () => window.location.search;

export const useSearchParams = () => {
  // 외부 환경인 URL과 동기화하기 위해 useSyncExternalStore 사용
  const search = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const update = useCallback((next: URLSearchParams, options?: { replace?: boolean }) => {
    const url = `?${next.toString()}`;
    if (options?.replace) {
      window.history.replaceState(null, '', url);
    } else {
      window.history.pushState(null, '', url);
    }
    // pushState/replaceState는 popstate를 발생시키지 않으므로 subscriber에게 알리기 위해 수동 전파
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);

  return { searchParams: new URLSearchParams(search), update };
};
