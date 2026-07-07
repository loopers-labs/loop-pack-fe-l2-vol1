import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

// number[] 상태를 localStorage와 동기화한다(위시리스트·최근 본 상품의 공통 뼈대).
export function useLocalStorageState(key: string): [number[], Dispatch<SetStateAction<number[]>>] {
  const [value, setValue] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // localStorage 사용 불가 시 무시
    }
  }, [key, value]);

  return [value, setValue];
}
