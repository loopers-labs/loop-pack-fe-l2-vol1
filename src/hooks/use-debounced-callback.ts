import { useEffect, useMemo, useRef } from "react";

type DebouncedCallback<Args extends unknown[]> = ((...args: Args) => void) & {
  cancel: () => void;
  flush: () => void;
};

export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay = 300,
): DebouncedCallback<Args> {
  const callbackRef = useRef(callback);
  const delayRef = useRef(delay);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingArgsRef = useRef<Args | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
    delayRef.current = delay;
  }, [callback, delay]);

  const debounced = useMemo(() => {
    const cancel = () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      pendingArgsRef.current = null;
    };

    const flush = () => {
      if (timerRef.current === null || pendingArgsRef.current === null) return;
      const args = pendingArgsRef.current;
      cancel();
      callbackRef.current(...args);
    };

    const run = (...args: Args) => {
      pendingArgsRef.current = args;
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        const nextArgs = pendingArgsRef.current;
        pendingArgsRef.current = null;
        if (nextArgs !== null) {
          callbackRef.current(...nextArgs);
        }
      }, delayRef.current);
    };

    const fn = run as DebouncedCallback<Args>;
    fn.cancel = cancel;
    fn.flush = flush;
    return fn;
  }, []);

  useEffect(() => {
    return () => debounced.cancel();
  }, [debounced]);

  return debounced;
}
