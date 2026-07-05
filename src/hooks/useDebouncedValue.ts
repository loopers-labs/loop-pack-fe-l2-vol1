import { useEffect, useState } from 'react';

/**
 * 값이 마지막으로 바뀐 뒤 `delayMs`가 지나면 그 값을 반영한다.
 * 검색어·가격처럼 타이핑마다 바뀌는 입력을 서버 요청 파라미터로 넘기기 전에
 * 완충해, 키 입력당 요청이 발생하는 것을 막는 용도.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
