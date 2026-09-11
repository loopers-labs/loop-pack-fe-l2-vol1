// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProductSearchInput } from "@/_pages/products/ui/ProductSearchInput";

// setTimeout을 가짜로 돌려 debounce 창(300ms)을 손이 아니라 코드로 정확히 제어한다.
afterEach(() => {
  vi.useRealTimers();
});

describe("ProductSearchInput debounce", () => {
  it("타이핑이 멈추면 debounce 뒤 마지막 값으로 한 번만 onSearch한다", () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    render(<ProductSearchInput value="" onSearch={onSearch} />);
    const input = screen.getByRole("textbox");

    // 연속 입력: 매 입력마다 이전 타이머를 지우고 새로 걸므로, 아직은 호출되지 않는다.
    fireEvent.change(input, { target: { value: "니" } });
    fireEvent.change(input, { target: { value: "니트" } });
    expect(onSearch).not.toHaveBeenCalled();

    // 300ms 경과 → 마지막 값으로 한 번만. (연속 입력이 여러 번 호출되지 않는 게 debounce의 핵심)
    act(() => vi.advanceTimersByTime(300));
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("니트");
  });

  it("debounce가 끝나기 전에 value가 밖에서 바뀌면 옛 검색어를 push하지 않는다", () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    // value는 URL 상태다. 부모가 새 value를 내려주는 것 = 뒤로가기로 URL이 밖에서 바뀐 상황.
    const { rerender } = render(<ProductSearchInput value="" onSearch={onSearch} />);
    const input = screen.getByRole("textbox");

    // "니트" 입력 → 타이머 대기 중(아직 URL 반영 전)
    fireEvent.change(input, { target: { value: "니트" } });

    // 타이머가 터지기 전에 외부에서 URL(value)이 다른 조건으로 바뀐다(뒤로가기).
    rerender(<ProductSearchInput value="가방" onSearch={onSearch} />);

    // debounce 시간을 모두 흘려보내도 onSearch는 호출되지 않아야 한다.
    // value 변화에 반응하는 cleanup(deps: [value])이 대기 중이던 타이머를 취소했기 때문.
    // 이 취소가 없으면(deps: []) 죽은 타이머가 "니트"를 다시 push해 뒤로가기가 뒤집힌다.
    act(() => vi.advanceTimersByTime(300));
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("뒤로가기(popstate)가 발생하면 대기 중이던 debounce를 즉시 취소한다", () => {
    // 회귀: 입력 도중 debounce 마감 전에 뒤로가기를 누르면, popstate는 왔지만
    // URL(value) 갱신이 React에 도착하기 전이라 value 변경 cleanup은 아직 못 돈다.
    // 이때 대기 타이머가 발화하면 옛 입력값을 URL에 push해 input과 URL이 갈라진다.
    vi.useFakeTimers();
    const onSearch = vi.fn();
    render(<ProductSearchInput value="가디건" onSearch={onSearch} />);
    const input = screen.getByRole("textbox");

    // "가디저" 입력 → 타이머 대기(아직 URL 반영 전)
    fireEvent.change(input, { target: { value: "가디저" } });

    // debounce가 끝나기 전에 뒤로가기. value rerender 없이 popstate만 온 상태.
    act(() => window.dispatchEvent(new PopStateEvent("popstate")));

    // 시간을 다 흘려도 onSearch는 호출되지 않아야 한다.
    // popstate 핸들러가 타이머를 즉시 취소했기 때문. 취소가 없으면 "가디저"가 push돼 desync.
    act(() => vi.advanceTimersByTime(300));
    expect(onSearch).not.toHaveBeenCalled();
  });
});

// 뒤로/앞으로(popstate)일 때만 input을 리마운트해 IME 조합 버퍼까지 초기화하는 게 트샵 버그의 수정이다.
// jsdom은 실제 IME 조합을 흉내내지 못하므로, "리마운트가 일어나는 조건"이라는 메커니즘을 검증한다.
describe("ProductSearchInput 외부 변경 반영", () => {
  it("popstate 뒤 value가 바뀌면 input을 새 값으로 리마운트한다(IME 버퍼 초기화)", () => {
    const onSearch = vi.fn();
    const { rerender } = render(<ProductSearchInput value="" onSearch={onSearch} />);

    // 타이핑한 값이 DOM에 남아 있는 상태(언컨트롤드)
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "니트" } });
    expect(screen.getByRole("textbox")).toHaveValue("니트");

    // 뒤로가기(popstate) 후 URL(value)이 다른 값으로 바뀐다.
    act(() => window.dispatchEvent(new PopStateEvent("popstate")));
    rerender(<ProductSearchInput value="가방" onSearch={onSearch} />);

    // 리마운트되어 새 value를 보여준다. 타이핑 잔재("니트")가 남지 않는다.
    expect(screen.getByRole("textbox")).toHaveValue("가방");
  });

  it("popstate 없이 value가 바뀌면(자기 commit) 리마운트하지 않아 입력값이 유지된다", () => {
    const onSearch = vi.fn();
    const { rerender } = render(<ProductSearchInput value="" onSearch={onSearch} />);

    // 타이핑 → DOM에 "니트" 유지
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "니트" } });

    // 우리 debounce가 push한 값이 URL로 반영된 상황(popstate 아님).
    rerender(<ProductSearchInput value="니트" onSearch={onSearch} />);

    // 리마운트되지 않으므로 사용자가 친 값이 그대로 남는다(포커스·커서 유지의 근거).
    expect(screen.getByRole("textbox")).toHaveValue("니트");
  });
});
