import { useEffect, useRef, useState } from 'react';

/**
 * value가 delayMs 동안 안정되면 그 값을 반영한다. (타이핑 스트림 → 최종값만)
 * - 관심사: 값의 디바운스 파생 — 도메인을 모르는 범용 훅입니다.
 * - 냄새: 검색·가격 타이핑마다 키스트로크 단위로 fetch가 발생했습니다(요청 과다).
 *   반대로 input의 value에 디바운스를 걸면 controlled input 표시가 지연되어 타이핑이 깨집니다.
 * - 분리 기준: 상태 3분할의 "파생값" — 상태를 쪼개지 않고, raw 상태는 화면/URL에,
 *   디바운스된 파생값은 비싼 소비자(fetch)에만 물립니다.
 */
export const useDebouncedValue = <T>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState(value);

  const timeRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    timeRef.current = setTimeout(() => setDebounced(value), delayMs);

    return () => {
      if (timeRef.current) {
        clearTimeout(timeRef.current);
      }
    };
  }, [value, delayMs]);

  return debounced;
};
