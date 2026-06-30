import { useEffect, useState } from "react";

/**
 * 값이 delayMs 동안 더 바뀌지 않을 때까지 갱신을 미룬 디바운스 값을 돌려준다.
 * 입력은 즉시 화면에 반영하되, 이 파생값만 네트워크 요청 트리거로 쓰면
 * 키스트로크마다 요청이 나가는 것을 막을 수 있다.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timerId = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timerId);
  }, [value, delayMs]);

  return debouncedValue;
}
