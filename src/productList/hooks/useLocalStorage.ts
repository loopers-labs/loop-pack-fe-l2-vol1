import { useState } from 'react';

// localStorage를 저장소로 쓰는 상태를 관리하는 hook
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => read(key, initial));

  const set = (next: T) => {
    setValue(next);
    write(key, next);
  };

  return [value, set] as const;
}

function read<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);

    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage 사용 불가 시 무시
  }
}
