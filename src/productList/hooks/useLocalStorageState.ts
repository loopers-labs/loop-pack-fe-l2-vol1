import { useEffect, useState } from "react";

/**
 * localStorage 와 동기화되는 state.
 * 초기값을 lazy 하게 읽고, 값이 바뀔 때마다 외부 시스템(localStorage)에 기록한다.
 */
export function useLocalStorageState<T>(
  key: string,
  initialValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored === null) return initialValue;
      const parsed: T = JSON.parse(stored);
      return parsed;
    } catch {
      // 손상된 값/비공개 모드 등 localStorage 읽기 실패 시 초기값으로 대체
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // localStorage 쓰기 불가(용량 초과·비공개 모드 등) 시 화면 동작은 유지
    }
  }, [key, value]);

  return [value, setValue];
}
