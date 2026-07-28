// @vitest-environment jsdom
// Advanced C — 검색 히스토리: 새 검색 첫 입력은 push(beginSearch), 이후 입력은 replace(updateSearch)

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { ProductListFilters, SEARCH_DEBOUNCE_MS } from "./ProductListFilters";
import { useProductListSearchParams } from "@/hooks/useProductListSearchParams";

// URL 배선 hook 을 mock 해 push/replace 분기 로직만 격리 검증한다(실제 nuqs·URL 없이).
vi.mock("@/hooks/useProductListSearchParams", () => ({
  useProductListSearchParams: vi.fn(),
}));

const useSearchParamsMock = vi.mocked(useProductListSearchParams);

type Handlers = Pick<
  ReturnType<typeof useProductListSearchParams>,
  "beginSearch" | "updateSearch"
>;

function makeHandlers(): Handlers {
  return { beginSearch: vi.fn(), updateSearch: vi.fn() };
}

function mockHook(handlers: Handlers, searchTerm = "") {
  useSearchParamsMock.mockReturnValue({
    query: { q: searchTerm, category: "all", sort: "latest", page: 1 },
    beginSearch: handlers.beginSearch,
    updateSearch: handlers.updateSearch,
    setFilter: vi.fn(),
    setPage: vi.fn(),
    clampPageToRange: vi.fn(),
  });
}

function type(value: string) {
  fireEvent.change(screen.getByRole("searchbox"), { target: { value } });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("ProductListFilters 검색 히스토리(push/replace)", () => {
  test("새 검색의 첫 입력은 beginSearch(push)로 새 엔트리를 연다", () => {
    const handlers = makeHandlers();
    mockHook(handlers);
    render(<ProductListFilters />);

    type("s");

    expect(handlers.beginSearch).toHaveBeenCalledWith("s");
    expect(handlers.updateSearch).not.toHaveBeenCalled();
  });

  test("이어지는 입력은 updateSearch(replace)로 현재 엔트리만 갱신한다", () => {
    const handlers = makeHandlers();
    mockHook(handlers);
    render(<ProductListFilters />);

    type("s");
    type("st");

    expect(handlers.beginSearch).toHaveBeenCalledTimes(1);
    expect(handlers.updateSearch).toHaveBeenCalledWith("st");
  });

  test("타이핑이 멈춰 draft 세션이 닫히면 다음 입력은 다시 beginSearch 다", () => {
    const handlers = makeHandlers();
    mockHook(handlers);
    render(<ProductListFilters />);

    type("s");
    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });
    type("a");

    expect(handlers.beginSearch).toHaveBeenCalledTimes(2);
    expect(handlers.beginSearch).toHaveBeenLastCalledWith("a");
  });

  test("외부 URL 변경(뒤로가기 등)은 커밋 없이 입력창만 맞춘다", () => {
    const handlers = makeHandlers();
    mockHook(handlers, "");
    const { rerender } = render(<ProductListFilters />);

    mockHook(handlers, "nike"); // 타이핑 없이 URL 검색어만 외부에서 바뀐 상황
    rerender(<ProductListFilters />);

    expect(handlers.beginSearch).not.toHaveBeenCalled();
    expect(handlers.updateSearch).not.toHaveBeenCalled();
    expect(screen.getByRole<HTMLInputElement>("searchbox").value).toBe("nike");
  });
});
