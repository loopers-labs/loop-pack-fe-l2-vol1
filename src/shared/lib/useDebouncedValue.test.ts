// @vitest-environment jsdom
// Advanced C - 검색어 debounce(항목1)에 사용할 useDebouncedValue 훅 단위 테스트

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useDebouncedValue } from "./useDebouncedValue";

const DELAY_MS = 300;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useDebouncedValue", () => {
  test("초기값을 그대로 반환한다", () => {
    const { result } = renderHook(() => useDebouncedValue("a", DELAY_MS));

    expect(result.current).toBe("a");
  });

  test("지연 시간 내에는 이전 값을 유지한다", () => {
    // renderHook: 컴포넌트 없이 훅만 테스트용으로 렌더한다.
    //   - 콜백 `({ value }) => useDebouncedValue(...)` 이 매 렌더마다 실행되는 "가짜 컴포넌트" 본문.
    //   - initialProps: 그 콜백에 처음 넘길 props → 여기선 value="a" 로 시작.
    //   - result: 훅의 반환값을 담는 상자. 최신값은 항상 result.current 로 읽는다.
    //   - rerender: props 를 바꿔 훅을 다시 렌더한다(= 부모가 새 value 를 내려준 상황 재현).
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, DELAY_MS),
      { initialProps: { value: "a" } },
    );

    // value 를 "ab" 로 바꿔 재렌더 → 훅 내부에서 300ms 디바운스 타이머가 시작된다.
    rerender({ value: "ab" });
    // act: state 변화를 유발하는 동작을 감싸, React 의 리렌더가 다 끝난 뒤 단언하게 한다.
    // vi.advanceTimersByTime: 가짜 타이머의 시간을 인위적으로 흘린다(실제로 기다리지 않음).
    //   여기선 DELAY_MS-1(=299ms)만 흘려 타이머 만료 "직전"까지만 진행.
    act(() => {
      vi.advanceTimersByTime(DELAY_MS - 1);
    });

    // 아직 300ms 가 안 찼으므로 디바운스 값은 커밋되지 않고 이전 값 "a" 그대로.
    expect(result.current).toBe("a");
  });

  test("지연 시간이 지나면 최신 값을 반영한다", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, DELAY_MS),
      { initialProps: { value: "a" } },
    );

    rerender({ value: "ab" });
    act(() => {
      vi.advanceTimersByTime(DELAY_MS);
    });

    expect(result.current).toBe("ab");
  });

  test("지연 내 연속 변경 시 마지막 값만 반영한다(중간값은 스킵)", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, DELAY_MS),
      { initialProps: { value: "a" } },
    );

    rerender({ value: "ab" });
    act(() => {
      vi.advanceTimersByTime(DELAY_MS - 100);
    });
    // 아직 커밋 전에 값이 또 바뀌면 타이머가 리셋된다
    rerender({ value: "abc" });
    act(() => {
      vi.advanceTimersByTime(DELAY_MS - 100);
    });
    expect(result.current).toBe("a"); // 리셋됐으므로 아직 초기값

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe("abc"); // 마지막 값만 반영, "ab"는 건너뜀
  });
});
