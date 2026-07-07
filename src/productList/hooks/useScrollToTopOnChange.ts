import { useEffect, useRef } from "react";

// 값이 "실제로 바뀌었을 때만" 창을 맨 위로 스크롤한다(외부 시스템 = window 동기화).
// 이전 값을 ref로 들고 비교 → 첫 마운트에는 스크롤이 튀지 않는다.
export function useScrollToTopOnChange(value: number) {
  const previous = useRef(value);

  useEffect(() => {
    if (previous.current !== value) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      previous.current = value;
    }
  }, [value]);
}
