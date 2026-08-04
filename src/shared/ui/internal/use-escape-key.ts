import { useEffect, useEffectEvent } from "react";

export function useEscapeKey(handler: () => void, enabled: boolean): void {
  const onEscape = useEffectEvent(handler);

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEscape();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
