// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { makeProduct, makeProductListResponse } from "@/test/handlers";
import { renderWithProviders } from "@/test/renderWithProviders";
import { server } from "@/test/server";

import { ProductListView } from "./ProductListView";

const trackEvent = vi.hoisted(() => vi.fn());
vi.mock("@/analytics/schema", () => ({ trackEvent }));

beforeEach(() => trackEvent.mockClear());

function renderView(searchParams?: Record<string, string>) {
  return renderWithProviders(<ProductListView />, { searchParams });
}

describe("ProductListView 부분 실패 — 결과 영역만 경계로", () => {
  it("목록 조회가 5xx로 실패하면 결과+페이지네이션은 fallback으로 바뀌고 필터는 살아남는다", async () => {
    // 5xx → fetchJson이 ApiError("http", 500)로 던지고, throwOnError 정책이 결과 경계로 전파한다.
    // 필터를 보는 관찰자는 throwOnError:false라 던지지 않는다.
    // (헤더는 (commerce) layout이 렌더하므로 ProductListView 단독 렌더엔 없다 — 헤더 생존은 layout의 책임.)
    server.use(
      http.get("*/api/products", () =>
        HttpResponse.json({ message: "서버 오류" }, { status: 500 }),
      ),
    );

    renderView();

    // 결과 영역: 경계 fallback("다시 시도")이 뜬다.
    expect(await screen.findByRole("button", { name: "다시 시도" })).toBeInTheDocument();

    // 필터는 살아 있다: 카테고리 select가 그대로 있다(조건을 바꿔 재시도 가능).
    expect(screen.getByRole("combobox", { name: /카테고리/ })).toBeInTheDocument();

    // 페이지네이션은 결과와 함께 fallback으로 바뀌어 사라진다.
    expect(screen.queryByRole("navigation", { name: "페이지 이동" })).not.toBeInTheDocument();
  });
});

describe("ProductListView 필터 초기화 (Advanced B-1)", () => {
  it("초기화를 누르면 필터가 기본값으로 돌아간다", async () => {
    server.use(
      http.get("*/api/products", () =>
        HttpResponse.json(makeProductListResponse({ products: [], totalCount: 0 })),
      ),
    );

    renderView({ category: "fashion" });

    const categorySelect = screen.getByRole("combobox", { name: /카테고리/ });
    expect(categorySelect).toHaveValue("fashion");

    fireEvent.click(screen.getByRole("button", { name: "초기화" }));

    // URL에서 조건이 제거되면 제어 select가 기본값("all")으로 돌아간다.
    await waitFor(() => expect(categorySelect).toHaveValue("all"));
  });
});

// 조작 뒤 URL 상태를 관찰하려고 onUrlUpdate로 마지막 searchParams를 잡는다.
function renderCapturingUrl(searchParams: Record<string, string>, totalCount = 30) {
  server.use(
    http.get("*/api/products", () =>
      HttpResponse.json(makeProductListResponse({ totalCount, products: [makeProduct()] })),
    ),
  );
  const onUrlUpdate = vi.fn();
  renderWithProviders(<ProductListView />, { searchParams, onUrlUpdate });
  return onUrlUpdate;
}

function lastUrl(onUrlUpdate: ReturnType<typeof vi.fn>): URLSearchParams {
  const calls = onUrlUpdate.mock.calls;
  return calls[calls.length - 1][0].searchParams as URLSearchParams;
}

describe("ProductListView 필터 조작 — page 리셋과 필터 유지", () => {
  it("카테고리를 바꾸면 page가 1로 초기화되고 카테고리는 유지된다", async () => {
    const onUrlUpdate = renderCapturingUrl({ page: "3" });

    fireEvent.change(await screen.findByRole("combobox", { name: /카테고리/ }), {
      target: { value: "fashion" },
    });

    await waitFor(() => {
      const url = lastUrl(onUrlUpdate);
      expect(url.get("category")).toBe("fashion");
      // page 1은 기본값이라 URL에서 생략된다 — page 파라미터가 사라진 것이 리셋의 증거다.
      expect(url.get("page")).toBeNull();
    });
  });

  it("정렬을 바꾸면 page가 1로 초기화되고 카테고리·검색어는 유지된다", async () => {
    const onUrlUpdate = renderCapturingUrl({ category: "fashion", q: "니트", page: "3" });

    fireEvent.change(await screen.findByRole("combobox", { name: /정렬/ }), {
      target: { value: "price-asc" },
    });

    await waitFor(() => {
      const url = lastUrl(onUrlUpdate);
      expect(url.get("sort")).toBe("price-asc");
      expect(url.get("category")).toBe("fashion");
      expect(url.get("q")).toBe("니트");
      expect(url.get("page")).toBeNull();
    });
  });
});

describe("ProductListView 페이지 이동 — 필터 유지와 경계", () => {
  it("다음을 누르면 페이지가 오르고 필터는 유지된다", async () => {
    const onUrlUpdate = renderCapturingUrl({ category: "fashion" });

    fireEvent.click(await screen.findByRole("button", { name: "다음" }));

    await waitFor(() => {
      const url = lastUrl(onUrlUpdate);
      expect(url.get("page")).toBe("2");
      expect(url.get("category")).toBe("fashion");
    });
  });

  it("첫 페이지에선 이전이 비활성이다", async () => {
    // totalCount 30 / pageSize 10 → 3페이지, 시작은 1페이지.
    renderCapturingUrl({});

    expect(await screen.findByRole("button", { name: "이전" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "다음" })).toBeEnabled();
  });

  it("마지막 페이지에선 다음이 비활성이다", async () => {
    // 3페이지 중 3페이지가 마지막.
    renderCapturingUrl({ page: "3" });

    expect(await screen.findByRole("button", { name: "다음" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "이전" })).toBeEnabled();
  });

  it("결과가 한 페이지뿐이면 이전·다음 모두 비활성이다", async () => {
    // totalCount 5 → 1페이지.
    renderCapturingUrl({}, 5);

    expect(await screen.findByRole("button", { name: "이전" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "다음" })).toBeDisabled();
  });
});

describe("ProductListView URL 재진입 — 컨트롤 복원", () => {
  it("URL로 재진입하면 각 컨트롤이 자기 param 값으로 복원된다", () => {
    // 각 컨트롤이 올바른 param에 연결됐는지 본다 — 정렬 값이 카테고리로 새지 않는다.
    renderCapturingUrl({ category: "fashion", sort: "price-asc" });

    expect(screen.getByRole("combobox", { name: /카테고리/ })).toHaveValue("fashion");
    expect(screen.getByRole("combobox", { name: /정렬/ })).toHaveValue("price-asc");
  });
});

describe("ProductListView 계측 발화 조건", () => {
  it("진입 시 product_list_view를 진입 시점 조건과 함께 1회 찍는다", () => {
    renderView({ category: "fashion", sort: "popular", page: "2" });

    expect(trackEvent).toHaveBeenCalledExactlyOnceWith("product_list_view", {
      category: "fashion",
      sort: "popular",
      page: 2,
    });
  });

  it("카테고리를 바꾸면 category_filter_change를 찍되 product_list_view는 다시 찍지 않는다", () => {
    renderView();
    trackEvent.mockClear(); // 진입 시 찍힌 product_list_view를 걷어내고 이후만 본다.

    fireEvent.change(screen.getByRole("combobox", { name: /카테고리/ }), {
      target: { value: "fashion" },
    });

    expect(trackEvent).toHaveBeenCalledExactlyOnceWith("category_filter_change", {
      category: "fashion",
    });
  });

  it("정렬을 바꾸면 sort_change를 찍는다", () => {
    renderView();
    trackEvent.mockClear();

    fireEvent.change(screen.getByRole("combobox", { name: /정렬/ }), {
      target: { value: "price-asc" },
    });

    expect(trackEvent).toHaveBeenCalledExactlyOnceWith("sort_change", { sort: "price-asc" });
  });

  it("다음 페이지로 이동하면 page_change를 새 page와 함께 찍는다", async () => {
    // 페이지네이션은 totalCount>0일 때만 보이므로 결과가 있는 응답으로 렌더한다.
    renderCapturingUrl({}, 30);
    trackEvent.mockClear();

    fireEvent.click(await screen.findByRole("button", { name: "다음" }));

    expect(trackEvent).toHaveBeenCalledExactlyOnceWith("page_change", { page: 2 });
  });
});
