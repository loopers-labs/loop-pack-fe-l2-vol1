import { useEffect } from "react";

// 지정한 값이 바뀔 때마다 창을 맨 위로 스크롤한다(외부 시스템 = window 동기화).
export function useScrollToTopOnChange(value: number) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [value]);
}
