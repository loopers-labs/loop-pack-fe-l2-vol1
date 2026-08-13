// @vitest-environment jsdom
// 상품 목록 통합 테스트 — 로딩/빈결과/에러/재시도/필터·정렬·페이지(검증대상 4~10).
// 네트워크는 MSW 로 가로챈다(HTTP 클라이언트 직접 바꿔치기 없음). 기본 핸들러는 성공만,
// 실패·지연·조건별 응답은 각 테스트가 server.use(http.get(...)) 로 덮는다(가짜 서버).

import { Component, type ReactNode } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { QueryClientProvider } from "@tanstack/react-query";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { ProductList } from "./ProductList";
import { ProductListFilters } from "./ProductListFilters";
import ProductListError from "@/app/products/error";
import { makeQueryClient } from "@/shared/api";
import type { Product, ProductListResponse } from "@/entities/product";
import { server } from "@/__tests__/msw/server";
import { PRODUCTS_ENDPOINT } from "@/__tests__/msw/handlers";
import {
  makeProduct,
  makeResponse,
} from "@/__tests__/helpers/productListFactories";

const BOUNDARY_MARKER = "목록 에러 경계로 넘어감";
const LIST_LOAD_ERROR = "상품 목록을 불러오지 못했습니다.";

// render 중 throw 를 잡는 최소 경계. reset 으로 자식을 다시 mount 시켜 재시도(week8 검증대상 7)를 재현한다.
// (실제 앱에선 Next 의 error.tsx 가 이 자리를 맡는다 — week8 검증대상 7 은 그 진짜 컴포넌트를 fallback 으로 쓴다.)
class ResettableBoundary extends Component<
  { renderFallback: (reset: () => void) => ReactNode; children: ReactNode },
  { error: unknown }
> {
  state: { error: unknown } = { error: null };
  static getDerivedStateFromError(error: unknown) {
    return { error };
  }
  reset = () => this.setState({ error: null });
  render() {
    return this.state.error
      ? this.props.renderFallback(this.reset)
      : this.props.children;
  }
}

// retry:false — 실패를 재시도로 지연시키지 않고 즉시 확정해 에러 화면을 바로 검증한다.
function makeTestQueryClient() {
  const queryClient = makeQueryClient();
  queryClient.setDefaultOptions({
    queries: { ...queryClient.getDefaultOptions().queries, retry: false },
  });

  return queryClient;
}

function renderProductList(
  searchParams = "?page=1",
  renderFallback?: (reset: () => void) => ReactNode,
) {
  render(
    <QueryClientProvider client={makeTestQueryClient()}>
      <NuqsTestingAdapter searchParams={searchParams} hasMemory>
        {renderFallback ? (
          <ResettableBoundary renderFallback={renderFallback}>
            <ProductList />
          </ResettableBoundary>
        ) : (
          <ProductList />
        )}
      </NuqsTestingAdapter>
    </QueryClientProvider>,
  );
}

// 필터(카테고리·정렬·검색)와 목록을 같은 URL 상태 아래 함께 렌더 — 필터 조작이 목록 요청을 바꾼다.
function renderFiltersAndList(searchParams = "?page=1") {
  render(
    <QueryClientProvider client={makeTestQueryClient()}>
      <NuqsTestingAdapter searchParams={searchParams} hasMemory>
        <ProductListFilters />
        <ProductList />
      </NuqsTestingAdapter>
    </QueryClientProvider>,
  );
}

// 경계가 에러를 잡을 때 React 가 찍는 console.error 노이즈를 억제한다.
function silenceBoundaryError() {
  return vi.spyOn(console, "error").mockImplementation(() => {});
}

const productNames = () =>
  screen
    .getAllByRole("heading", { level: 3 })
    .map((heading) => heading.textContent);
const firstProductName = () => productNames()[0];

afterEach(cleanup);

describe("week8 검증대상 4 — 목록 로딩 → 성공", () => {
  test("로딩 중엔 상품이 없다가 응답이 오면 목록과 총 개수가 나타난다", async () => {
    server.use(
      http.get(PRODUCTS_ENDPOINT, () =>
        HttpResponse.json(
          makeResponse([makeProduct("p1", "상품A")], { totalCount: 1 }),
        ),
      ),
    );

    renderProductList();

    // 응답 전(로딩): 실제 목록은 아직 없다(스켈레톤은 aria-hidden 이라 접근성 트리에 안 잡힌다).
    expect(screen.queryByText("상품A")).toBeNull();

    expect(await screen.findByText("상품A")).toBeInTheDocument();
    expect(screen.getByText("총 1개")).toBeInTheDocument();
  });

  test("경계: 응답이 지연되는 동안엔 목록이 안 뜨고 도착하면 뜬다", async () => {
    let resolve: (value: ProductListResponse) => void = () => {};
    const pending = new Promise<ProductListResponse>((r) => {
      resolve = r;
    });
    server.use(
      http.get(PRODUCTS_ENDPOINT, async () => HttpResponse.json(await pending)),
    );

    renderProductList();
    expect(screen.queryByText("상품A")).toBeNull();

    resolve(makeResponse([makeProduct("p1", "상품A")], { totalCount: 1 }));
    expect(await screen.findByText("상품A")).toBeInTheDocument();
  });
});

describe("week8 검증대상 5 — 목록 빈 결과", () => {
  test("총 0건이면 '검색 결과가 없습니다' 안내가 뜬다", async () => {
    server.use(
      http.get(PRODUCTS_ENDPOINT, () =>
        HttpResponse.json(makeResponse([], { totalCount: 0 })),
      ),
    );

    renderProductList();

    expect(
      await screen.findByText("검색 결과가 없습니다."),
    ).toBeInTheDocument();
  });

  test("경계: 총 개수는 있으나 현재 페이지에 상품이 없으면 그 페이지가 비었음을 알린다", async () => {
    // 경계: 전체 건수(30)는 있지만 이 페이지의 products 가 빈 응답 → 0건 안내와 다른 문구.
    server.use(
      http.get(PRODUCTS_ENDPOINT, () =>
        HttpResponse.json(makeResponse([], { totalCount: 30, page: 1 })),
      ),
    );

    renderProductList();

    expect(
      await screen.findByText("이 페이지에는 상품이 없습니다."),
    ).toBeInTheDocument();
    expect(screen.queryByText("검색 결과가 없습니다.")).toBeNull();
  });
});

describe("week8 검증대상 6 — 목록 에러 (5xx 경계 / 4xx 인라인)", () => {
  test("서버 오류(5xx)는 throw 해서 에러 경계로 넘어간다", async () => {
    server.use(
      http.get(PRODUCTS_ENDPOINT, () =>
        HttpResponse.json({ message: "서버 오류" }, { status: 500 }),
      ),
    );
    const consoleError = silenceBoundaryError();

    renderProductList("?page=1", () => <p>{BOUNDARY_MARKER}</p>);

    expect(await screen.findByText(BOUNDARY_MARKER)).toBeInTheDocument();

    consoleError.mockRestore();
  });

  test("경계: 잘못된 요청(4xx)은 에러 경계로 넘기지 않고 화면 안에서 인라인으로 알린다", async () => {
    server.use(
      http.get(PRODUCTS_ENDPOINT, () =>
        HttpResponse.json({ message: "요청 오류" }, { status: 400 }),
      ),
    );

    renderProductList("?page=1", () => <p>{BOUNDARY_MARKER}</p>);

    expect(await screen.findByText(LIST_LOAD_ERROR)).toBeInTheDocument();
    // 경계로 넘어가지 않았다 — 인라인이라 fallback 마커는 안 뜨고, 재시도 버튼도 없다.
    expect(screen.queryByText(BOUNDARY_MARKER)).toBeNull();
    expect(screen.queryByRole("button", { name: "다시 시도" })).toBeNull();
  });
});

describe("week8 검증대상 7 — 에러에서 재시도로 복구", () => {
  test("첫 로드 5xx 로 경계에 빠진 뒤 '다시 시도' 하면 재요청해 목록이 뜬다", async () => {
    // 첫 요청만 500, 이후 요청은 성공 → error.tsx 의 다시 시도(resetQueries+remount)로 복구되는지 본다.
    let shouldFail = true;
    server.use(
      http.get(PRODUCTS_ENDPOINT, () => {
        if (shouldFail) {
          shouldFail = false;

          return HttpResponse.json({ message: "서버 오류" }, { status: 500 });
        }

        return HttpResponse.json(
          makeResponse([makeProduct("p1", "복구된상품")], { totalCount: 1 }),
        );
      }),
    );
    const consoleError = silenceBoundaryError();

    renderProductList("?page=1", (reset) => <ProductListError reset={reset} />);

    const retryButton = await screen.findByRole("button", {
      name: "다시 시도",
    });
    await userEvent.click(retryButton);

    expect(await screen.findByText("복구된상품")).toBeInTheDocument();

    consoleError.mockRestore();
  });

  test("경계: 재시도했는데 또 5xx면 복구되지 않고 경계에 남아, 성공해야 비로소 복구된다", async () => {
    // 첫 로드와 첫 재시도까지 500, 세 번째 요청부터 성공. retry:false 라 mount 당 요청 1건이므로
    // "다시 시도"를 두 번 눌러야 복구된다는 것 자체가 "재시도했는데 또 실패하면 경계에 남는다"의 증거.
    let attempt = 0;
    server.use(
      http.get(PRODUCTS_ENDPOINT, () => {
        attempt += 1;

        if (attempt <= 2)
          return HttpResponse.json({ message: "서버 오류" }, { status: 500 });

        return HttpResponse.json(
          makeResponse([makeProduct("p1", "복구된상품")], { totalCount: 1 }),
        );
      }),
    );
    const consoleError = silenceBoundaryError();

    renderProductList("?page=1", (reset) => <ProductListError reset={reset} />);

    // 첫 로드 실패 → 경계. 첫 재시도.
    await userEvent.click(
      await screen.findByRole("button", { name: "다시 시도" }),
    );

    // 첫 재시도도 5xx → 복구 안 되고 경계에 그대로(다시 시도 버튼이 또 있고, 복구 상품은 안 뜬다).
    const retryAgain = await screen.findByRole("button", { name: "다시 시도" });
    expect(screen.queryByText("복구된상품")).toBeNull();

    // 두 번째 재시도에서 성공 → 목록 복구.
    await userEvent.click(retryAgain);
    expect(await screen.findByText("복구된상품")).toBeInTheDocument();

    consoleError.mockRestore();
  });
});

describe("week8 검증대상 8 — 카테고리 변경 → 목록 변경", () => {
  test("카테고리를 바꾸면 그 카테고리 상품만 남고, 전체로 돌리면 다시 다 보인다", async () => {
    // 실제 카테고리를 가진 상품들 — 목이 서버처럼 category 파라미터로 필터해 돌려준다.
    const products: Product[] = [
      { ...makeProduct("f1", "패션상품"), category: "fashion" },
      { ...makeProduct("h1", "홈상품"), category: "home" },
    ];
    server.use(
      http.get(PRODUCTS_ENDPOINT, ({ request }) => {
        const category = new URL(request.url).searchParams.get("category"); // 전체(all)는 요청에서 생략되어 null
        const filtered = category
          ? products.filter((product) => product.category === category)
          : products;

        return HttpResponse.json(makeResponse(filtered));
      }),
    );

    renderFiltersAndList();
    // 초기(전체): 두 카테고리 상품이 모두 보인다.
    expect(await screen.findByText("홈상품")).toBeInTheDocument();
    expect(screen.getByText("패션상품")).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText("카테고리"), "fashion");

    // 패션 필터가 적용되면 다른 카테고리(홈)는 사라진다.
    await waitFor(() => expect(screen.queryByText("홈상품")).toBeNull());
    expect(screen.getByText("패션상품")).toBeInTheDocument();

    // 다시 전체로 → 홈상품 복귀
    await userEvent.selectOptions(screen.getByLabelText("카테고리"), "all");
    expect(await screen.findByText("홈상품")).toBeInTheDocument();
    expect(screen.getByText("패션상품")).toBeInTheDocument();
  });
});

describe("week8 검증대상 9 — 정렬 변경 → 순서 변경", () => {
  test("정렬을 바꾸면 보이는 상품이 가격 순서대로 재배열된다", async () => {
    // 실제 가격을 가진 상품들 — 목이 서버처럼 sort 파라미터대로 이 데이터를 정렬해 돌려준다.
    const products = [
      { ...makeProduct("mid", "중간가격"), price: 20000 },
      { ...makeProduct("high", "높은가격"), price: 30000 },
      { ...makeProduct("low", "낮은가격"), price: 10000 },
    ];
    server.use(
      http.get(PRODUCTS_ENDPOINT, ({ request }) => {
        const sort = new URL(request.url).searchParams.get("sort");
        const sorted = [...products].sort((a, b) => {
          if (sort === "price-desc") return b.price - a.price;

          if (sort === "price-asc") return a.price - b.price;

          return 0;
        });

        return HttpResponse.json(makeResponse(sorted));
      }),
    );

    renderFiltersAndList();
    await screen.findByText("중간가격");

    await userEvent.selectOptions(screen.getByLabelText("정렬"), "price-desc");

    // 높은 가격이 먼저 오도록 전체 순서가 재배열된다.
    await waitFor(() => expect(firstProductName()).toBe("높은가격"));
    expect(productNames()).toEqual(["높은가격", "중간가격", "낮은가격"]);

    // 경계: 낮은 가격순으로 바꾸면 순서가 뒤집힌다.
    await userEvent.selectOptions(screen.getByLabelText("정렬"), "price-asc");
    await waitFor(() => expect(firstProductName()).toBe("낮은가격"));
    expect(productNames()).toEqual(["낮은가격", "중간가격", "높은가격"]);
  });
});

describe("week8 검증대상 10 — 페이지 이동 → 목록 변경", () => {
  test("'다음'을 누르면 다음 페이지 목록으로 바뀐다", async () => {
    server.use(
      http.get(PRODUCTS_ENDPOINT, ({ request }) => {
        const page = new URL(request.url).searchParams.get("page");

        return HttpResponse.json(
          page === "2"
            ? makeResponse([makeProduct("p13", "2페이지상품")], {
                totalCount: 30,
                page: 2,
              })
            : makeResponse([makeProduct("p1", "1페이지상품")], {
                totalCount: 30,
                page: 1,
              }),
        );
      }),
    );

    renderProductList("?page=1");
    expect(await screen.findByText("1페이지상품")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "다음" }));

    expect(await screen.findByText("2페이지상품")).toBeInTheDocument();
    expect(screen.queryByText("1페이지상품")).toBeNull();
  });

  test("경계: 다음 페이지 응답이 지연돼도 도착 전까진 이전 목록을 유지한다(keepPreviousData)", async () => {
    let resolvePage2: (value: ProductListResponse) => void = () => {};
    const page2 = new Promise<ProductListResponse>((r) => {
      resolvePage2 = r;
    });
    server.use(
      http.get(PRODUCTS_ENDPOINT, async ({ request }) => {
        const page = new URL(request.url).searchParams.get("page");

        if (page === "2") return HttpResponse.json(await page2);

        return HttpResponse.json(
          makeResponse([makeProduct("p1", "1페이지상품")], {
            totalCount: 30,
            page: 1,
          }),
        );
      }),
    );

    renderProductList("?page=1");
    expect(await screen.findByText("1페이지상품")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "다음" }));

    // page 2 가 아직 도착 전 — 빈 화면이 아니라 이전 페이지 목록이 그대로 남아 있다.
    expect(screen.getByText("1페이지상품")).toBeInTheDocument();

    resolvePage2(
      makeResponse([makeProduct("p13", "2페이지상품")], {
        totalCount: 30,
        page: 2,
      }),
    );
    expect(await screen.findByText("2페이지상품")).toBeInTheDocument();
    expect(screen.queryByText("1페이지상품")).toBeNull();
  });
});
