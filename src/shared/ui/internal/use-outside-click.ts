import { useEffect, useEffectEvent, type RefObject } from "react";

export function useOutsideClick(
  ref: RefObject<HTMLElement | null>,
  handler: () => void,
  enabled: boolean,
): void {
  const onOutside = useEffectEvent(handler);

  useEffect(() => {
    if (!enabled) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onOutside();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [enabled, ref]);
}
