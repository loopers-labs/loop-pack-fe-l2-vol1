import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebouncedValue } from "./useDebouncedValue";

describe("useDebouncedValue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("delay가 지나기 전에는 이전 값을 유지한다", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: "before" },
    });

    rerender({ value: "after" });

    act(() => {
      vi.advanceTimersByTime(299);
    });

    expect(result.current).toBe("before");
  });

  it("delay가 지나면 변경된 값을 반환한다", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: "before" },
    });

    rerender({ value: "after" });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe("after");
  });

  it("delay 전에 값이 다시 바뀌면 이전 타이머를 취소한다", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: "first" },
    });

    rerender({ value: "second" });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    rerender({ value: "third" });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toBe("first");

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toBe("third");
  });
});
