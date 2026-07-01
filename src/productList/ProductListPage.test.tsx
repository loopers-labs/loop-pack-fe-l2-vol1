import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProductListPage } from "./ProductListPage";

// 매 테스트 새 QueryClient — 캐시가 다음 테스트로 새지 않게 하고,
// retry 를 꺼 mock 응답 하나로 요청 횟수가 결정적이게 만든다.
function renderWithClient(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

function stubFetchOk() {
  const fetchMock = vi.fn<
    (input: string, init?: RequestInit) => Promise<unknown>
  >(async () => ({
    ok: true,
    json: async () => ({ products: [], totalCount: 0 }),
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  // 렌더된 컴포넌트를 DOM 에서 언마운트·제거한다 — 테스트마다 DOM 을 깨끗한 상태로 격리.
  cleanup();
  // 이 테스트가 켠 fake timer(useFakeTimers)를 실제 타이머로 되돌린다.
  // 안 되돌리면 다음 테스트가 가짜 시계를 물려받아 setTimeout 이 저절로 안 돈다.
  vi.useRealTimers();
  // stubGlobal 로 바꿔치기한 전역(fetch·scrollTo 등)을 원래 구현으로 복원한다.
  vi.unstubAllGlobals();
  // URL 을 만지는 테스트가 다음 테스트로 새지 않게 초기화한다.
  window.history.replaceState(null, "", "/");
});

describe("ProductListPage — 검색어 디바운스로 불필요한 API 요청 방지", () => {
  it("빠르게 여러 글자를 입력해도 요청은 마운트 1회 + 디바운스 확정 1회만 나간다", async () => {
    // 디바운스가 없으면 키스트로크 3번이 최대 3번의 추가 요청(총 4번)을 유발한다.
    // 디바운스가 살아있으면 타이핑 중 query.searchQuery 가 "" 로 고정돼 queryKey 가
    // 구조적으로 안 바뀌므로 재요청이 0이고, 300ms 무입력 뒤 마지막 값으로 한 번만 확정된다.
    const fetchMock = stubFetchOk();
    vi.stubGlobal("scrollTo", vi.fn()); // ProductListPage 의 scrollTo 회피
    // 디바운스는 setTimeout 기반이라 실제로 300ms 를 기다려야 확정된다.
    // 타이머를 가짜로 바꿔 두면 실제 시간을 안 흘려보내고 advanceTimersByTime 으로
    // 시계를 수동으로 감아 원하는 순간에 콜백을 터뜨릴 수 있다(테스트가 빠르고 결정적).
    vi.useFakeTimers();

    // act: 이 안에서 일어난 렌더·effect·상태 업데이트가 다 끝날 때까지 기다린다.
    // 안 감싸면 화면이 갱신되기 전에 단언하게 되고 "not wrapped in act" 경고가 뜬다.
    await act(async () => {
      renderWithClient(<ProductListPage />);
    });

    // (A) 마운트 요청이 끝날 때까지 기다린다 — isLoading 이 풀려야 검색창이 DOM 에 등장한다.
    // advanceTimersByTimeAsync(ms): 가짜 시계를 ms 만큼 감아 그 사이 예약된 setTimeout 을
    // 실행하고, 그 콜백이 낸 요청(fetch)이 끝날 때까지 기다리는 async 버전.
    // 0 을 주면 시간은 안 넘기고 이미 예약돼 대기 중인 작업만 마저 끝낸다.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // (B) 300ms 안에 빠르게 3글자 입력 — 타이핑만으로는 요청이 나가면 안 된다.
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "a" } });
    fireEvent.change(input, { target: { value: "ab" } });
    fireEvent.change(input, { target: { value: "abc" } });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // (C) 디바운스 확정 — 마지막 값("abc")으로 딱 한 번만 재요청한다.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining("q=abc"),
      expect.anything(),
    );
  });
});

describe("ProductListPage — URL 쿼리에서 필터·검색·페이지 상태 복원", () => {
  it("필터가 담긴 URL 로 열면 첫 요청과 컨트롤에 그 조건이 그대로 반영된다", async () => {
    // 새로고침/북마크/공유를 흉내내 필터가 실린 URL 로 진입한다.
    window.history.replaceState(
      null,
      "",
      "?category=fashion&sort=price-asc&q=coat&page=2&inStock=true",
    );
    const fetchMock = stubFetchOk();
    vi.stubGlobal("scrollTo", vi.fn()); // page 복원 시 도는 scrollToTop 회피

    renderWithClient(<ProductListPage />);

    // 로딩이 끝나 컨트롤이 DOM 에 등장할 때까지 대기.
    const input = await screen.findByRole<HTMLInputElement>("searchbox");

    // (a) 서버로 가는 첫 요청부터 복원된 조건(카테고리·정렬·검색어·페이지)이 실려나간다.
    const firstRequestUrl = fetchMock.mock.calls[0][0];
    expect(firstRequestUrl).toContain("category=fashion");
    expect(firstRequestUrl).toContain("sort=price-asc");
    expect(firstRequestUrl).toContain("q=coat");
    expect(firstRequestUrl).toContain("page=2");

    // (b) 컨트롤도 복원된 상태를 보여준다 — 검색어(서버 조건)와 재고 토글(클라이언트 전용).
    expect(input.value).toBe("coat");
    const inStockCheckbox = screen.getByRole<HTMLInputElement>("checkbox");
    expect(inStockCheckbox.checked).toBe(true);
  });
});
