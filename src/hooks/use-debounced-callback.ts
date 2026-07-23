import { useEffect, useMemo, useRef } from "react";

export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay = 300,
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const delayRef = useRef(delay);
  delayRef.current = delay;

  const debounced = useMemo(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let pendingArgs: Args | null = null;

    const cancel = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      pendingArgs = null;
    };

    const flush = () => {
      if (timer === null || pendingArgs === null) return;
      const args = pendingArgs;
      cancel();
      callbackRef.current(...args);
    };

    const run = (...args: Args) => {
      pendingArgs = args;
      if (timer !== null) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        timer = null;
        const nextArgs = pendingArgs;
        pendingArgs = null;
        if (nextArgs !== null) {
          callbackRef.current(...nextArgs);
        }
      }, delayRef.current);
    };

    return Object.assign(run, { cancel, flush });
  }, []);

  useEffect(() => {
    return () => debounced.cancel();
  }, [debounced]);

  return debounced;
}
