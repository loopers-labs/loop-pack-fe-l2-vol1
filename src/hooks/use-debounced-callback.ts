import { useEffect, useRef } from "react";

export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay = 300,
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (...args: Args) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => callbackRef.current(...args), delay);
  };
}
