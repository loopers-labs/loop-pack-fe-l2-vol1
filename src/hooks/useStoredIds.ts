import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export function useStoredIds(
  key: string,
): [number[], Dispatch<SetStateAction<number[]>>] {
  const [ids, setIds] = useState<number[]>(() => {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
      if (
        Array.isArray(parsed) &&
        parsed.every((n): n is number => typeof n === 'number')
      ) {
        return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(ids));
    } catch {
      // localStorage 사용 불가(프라이빗 모드 등) 시 무시
    }
  }, [key, ids]);

  return [ids, setIds];
}
