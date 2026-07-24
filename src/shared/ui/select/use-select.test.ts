import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useSelect } from "./use-select";

interface Fruit {
  id: string;
  label: string;
  disabled?: boolean;
}

function pressKey(key: string) {
  return { key, preventDefault: vi.fn() };
}

describe("useSelect", () => {
  const apple: Fruit = { id: "apple", label: "사과" };
  const banana: Fruit = { id: "banana", label: "바나나", disabled: true };
  const cherry: Fruit = { id: "cherry", label: "체리" };
  const options: Fruit[] = [apple, banana, cherry];
  const isOptionDisabled = (option: Fruit) => Boolean(option.disabled);

  it("초기 highlightedIndex는 -1이고 selected는 null이다", () => {
    const { result } = renderHook(() => useSelect({ options }));

    expect(result.current.highlightedIndex).toBe(-1);
    expect(result.current.selected).toBeNull();
  });

  it("ArrowDown을 누르면 첫 선택 가능한 옵션으로 highlight가 이동한다", () => {
    const { result } = renderHook(() => useSelect({ options }));

    act(() => result.current.onKeyDown(pressKey("ArrowDown")));

    expect(result.current.highlightedIndex).toBe(0);
  });

  it("ArrowDown이 중간의 비활성 옵션은 건너뛴다", () => {
    const { result } = renderHook(() => useSelect({ options, isOptionDisabled }));

    act(() => result.current.onKeyDown(pressKey("ArrowDown"))); // -> apple(0)
    act(() => result.current.onKeyDown(pressKey("ArrowDown"))); // banana(1) 스킵 -> cherry(2)

    expect(result.current.highlightedIndex).toBe(2);
  });

  it("마지막 옵션에서 ArrowDown을 눌러도 highlightedIndex가 유지된다(clamp)", () => {
    const { result } = renderHook(() => useSelect({ options: [apple, cherry] }));

    act(() => result.current.onKeyDown(pressKey("ArrowDown")));
    act(() => result.current.onKeyDown(pressKey("ArrowDown")));
    act(() => result.current.onKeyDown(pressKey("ArrowDown")));

    expect(result.current.highlightedIndex).toBe(1);
  });

  it("ArrowUp을 누르면 이전 선택 가능한 옵션으로 highlight가 이동한다", () => {
    const { result } = renderHook(() => useSelect({ options }));

    act(() => result.current.onKeyDown(pressKey("ArrowDown")));
    act(() => result.current.onKeyDown(pressKey("ArrowDown")));
    act(() => result.current.onKeyDown(pressKey("ArrowUp")));

    expect(result.current.highlightedIndex).toBe(0);
  });

  it("첫 옵션에서 ArrowUp을 눌러도 highlightedIndex가 유지된다(clamp)", () => {
    const { result } = renderHook(() => useSelect({ options }));

    act(() => result.current.onKeyDown(pressKey("ArrowDown")));
    act(() => result.current.onKeyDown(pressKey("ArrowUp")));
    act(() => result.current.onKeyDown(pressKey("ArrowUp")));

    expect(result.current.highlightedIndex).toBe(0);
  });

  it("모든 옵션이 비활성화면 ArrowDown을 눌러도 highlightedIndex가 -1을 유지하고 에러를 던지지 않는다", () => {
    const allDisabled: Fruit[] = [
      { id: "a", label: "a", disabled: true },
      { id: "b", label: "b", disabled: true },
    ];
    const { result } = renderHook(() => useSelect({ options: allDisabled, isOptionDisabled }));

    expect(() => {
      act(() => result.current.onKeyDown(pressKey("ArrowDown")));
    }).not.toThrow();
    expect(result.current.highlightedIndex).toBe(-1);
  });

  it("옵션이 빈 배열이면 ArrowDown을 눌러도 에러를 던지지 않는다", () => {
    const { result } = renderHook(() => useSelect({ options: [] }));

    expect(() => {
      act(() => result.current.onKeyDown(pressKey("ArrowDown")));
    }).not.toThrow();
    expect(result.current.highlightedIndex).toBe(-1);
  });

  it("Enter를 누르면 highlight된 옵션을 select하고 onChange를 그 옵션 객체로 호출한다", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useSelect({ options, onChange }));

    act(() => result.current.onKeyDown(pressKey("ArrowDown")));
    act(() => result.current.onKeyDown(pressKey("Enter")));

    expect(result.current.selected).toBe(apple);
    expect(onChange).toHaveBeenCalledWith(apple);
  });

  it("Esc를 누르면 닫힌다", () => {
    const { result } = renderHook(() => useSelect({ options }));

    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.onKeyDown(pressKey("Escape")));

    expect(result.current.isOpen).toBe(false);
  });

  it("open/close/toggle로 isOpen을 전환할 수 있다", () => {
    const { result } = renderHook(() => useSelect({ options }));

    expect(result.current.isOpen).toBe(false);
    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);
    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(true);
  });

  it("비활성 옵션을 select하면 selected가 바뀌지 않고 onChange도 호출되지 않는다", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useSelect({ options, isOptionDisabled, onChange }));

    act(() => result.current.select(banana));

    expect(result.current.selected).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("defaultSelected를 주면 초기 selected가 해당 객체다", () => {
    const { result } = renderHook(() => useSelect({ options, defaultSelected: cherry }));

    expect(result.current.selected).toBe(cherry);
  });

  it("getOptionState가 옵션별 selected/highlighted/disabled 상태를 반환한다", () => {
    const { result } = renderHook(() =>
      useSelect({ options, isOptionDisabled, defaultSelected: apple }),
    );

    act(() => result.current.onKeyDown(pressKey("ArrowDown"))); // highlight -> apple(0)

    expect(result.current.getOptionState(apple)).toEqual({
      selected: true,
      highlighted: true,
      disabled: false,
    });
    expect(result.current.getOptionState(banana)).toEqual({
      selected: false,
      highlighted: false,
      disabled: true,
    });
    expect(result.current.getOptionState(cherry)).toEqual({
      selected: false,
      highlighted: false,
      disabled: false,
    });
  });
});
