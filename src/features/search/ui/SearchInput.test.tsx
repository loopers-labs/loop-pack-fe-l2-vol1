// @vitest-environment jsdom
// Advanced C — 검색 히스토리: 새 검색 첫 입력은 push(onBeginSearch), 이후 입력은 replace(onUpdateSearch)

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { SearchInput, SEARCH_DEBOUNCE_MS } from "./SearchInput";

function type(value: string) {
  fireEvent.change(screen.getByRole("searchbox"), { target: { value } });
}

function renderSearch(searchTerm = "") {
  const onBeginSearch = vi.fn();
  const onUpdateSearch = vi.fn();
  const view = render(
    <SearchInput
      searchTerm={searchTerm}
      onBeginSearch={onBeginSearch}
      onUpdateSearch={onUpdateSearch}
    />,
  );

  const rerenderWith = (nextSearchTerm: string) =>
    view.rerender(
      <SearchInput
        searchTerm={nextSearchTerm}
        onBeginSearch={onBeginSearch}
        onUpdateSearch={onUpdateSearch}
      />,
    );

  return { onBeginSearch, onUpdateSearch, rerenderWith };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("SearchInput 검색 히스토리(push/replace)", () => {
  test("새 검색의 첫 입력은 onBeginSearch(push)로 새 엔트리를 연다", () => {
    const { onBeginSearch, onUpdateSearch } = renderSearch();

    type("s");

    expect(onBeginSearch).toHaveBeenCalledWith("s");
    expect(onUpdateSearch).not.toHaveBeenCalled();
  });

  test("이어지는 입력은 onUpdateSearch(replace)로 현재 엔트리만 갱신한다", () => {
    const { onBeginSearch, onUpdateSearch } = renderSearch();

    type("s");
    type("st");

    expect(onBeginSearch).toHaveBeenCalledTimes(1);
    expect(onUpdateSearch).toHaveBeenCalledWith("st");
  });

  test("타이핑이 멈춰 draft 세션이 닫히면 다음 입력은 다시 onBeginSearch 다", () => {
    const { onBeginSearch } = renderSearch();

    type("s");
    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });
    type("a");

    expect(onBeginSearch).toHaveBeenCalledTimes(2);
    expect(onBeginSearch).toHaveBeenLastCalledWith("a");
  });

  test("외부 검색어 변경(뒤로가기 등)은 콜백 없이 입력창만 맞춘다", () => {
    const { onBeginSearch, onUpdateSearch, rerenderWith } = renderSearch("");

    rerenderWith("nike"); // 타이핑 없이 URL 검색어만 외부에서 바뀐 상황

    expect(onBeginSearch).not.toHaveBeenCalled();
    expect(onUpdateSearch).not.toHaveBeenCalled();
    expect(screen.getByRole<HTMLInputElement>("searchbox").value).toBe("nike");
  });
});
