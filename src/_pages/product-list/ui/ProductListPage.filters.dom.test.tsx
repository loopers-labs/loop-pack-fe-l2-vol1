import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import type { UrlUpdateEvent } from "nuqs/adapters/testing";
import { describe, expect, it } from "vitest";
import { products } from "@/app/api/_data/commerce";
import { PAGE_SIZE, PRODUCTS_ENDPOINT, productListResponse } from "@/mocks/handlers";
import { server } from "@/mocks/server";
import { renderWithProviders } from "@/test/render";
import { createRequestLog } from "@/test/requests";
import { ProductListPage } from "./ProductListPage";

// 8·9·10·11번 항목 — 조작이 목록과 URL에 반영되는가.
//
// 모든 핸들러는 **요청의 조건을 읽어** 응답을 고른다. 호출 순서로 응답을 고르면
// params.set(...) 줄을 지워도 조건이 바뀌는 순간 query key가 갈려 재요청이 나가고
// 화면도 바뀌어 통과한다(false green).

const FASHION = products.filter((product) => product.category === "fashion");
const renderedNames = () =>
  screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);

describe("8번 — 카테고리 변경 → 목록 변경", () => {
  it("카테고리를 바꾸면 그 카테고리 목록이 오고 page가 1로 돌아간다", async () => {
    const user = userEvent.setup();
    const log = createRequestLog();

    server.use(
      http.get(PRODUCTS_ENDPOINT, ({ request }) => {
        const params = log.record(request);
        const category = params.get("category");
        if (category === null) {
          return HttpResponse.json({ message: "category가 없다" }, { status: 400 });
        }
        const matched = category === "all" ? products : FASHION;
        return HttpResponse.json(
          productListResponse({
            products: matched.slice(0, PAGE_SIZE),
            totalCount: matched.length,
          }),
        );
      }),
    );

    renderWithProviders(<ProductListPage />, { searchParams: "?category=all&page=3" });

    expect(await screen.findByText(`총 ${products.length}개`)).toBeInTheDocument();
    expect(log.last().get("page")).toBe("3");

    await user.selectOptions(screen.getByLabelText("카테고리"), "fashion");

    await waitFor(() => {
      expect(log.last().get("category")).toBe("fashion");
    });

    // 이게 진짜 계약이다 — 3페이지에서 카테고리를 바꿨는데 page가 남으면
    // 그 카테고리에 3페이지가 없어 방금 바꾼 조건이 0건으로 보인다.
    expect(log.last().get("page")).toBe("1");
    expect(await screen.findByText(`총 ${FASHION.length}개`)).toBeInTheDocument();
  });

  it("전체로 되돌리면 다시 전체 목록이 온다", async () => {
    const user = userEvent.setup();
    const log = createRequestLog();

    server.use(
      http.get(PRODUCTS_ENDPOINT, ({ request }) => {
        const matched = log.record(request).get("category") === "all" ? products : FASHION;
        return HttpResponse.json(
          productListResponse({
            products: matched.slice(0, PAGE_SIZE),
            totalCount: matched.length,
          }),
        );
      }),
    );

    renderWithProviders(<ProductListPage />, { searchParams: "?category=fashion" });
    expect(await screen.findByText(`총 ${FASHION.length}개`)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("카테고리"), "all");

    expect(await screen.findByText(`총 ${products.length}개`)).toBeInTheDocument();
  });
});

describe("9번 — 정렬 변경 → 순서 변경", () => {
  // 핸들러가 sort를 읽지 못하면 400을 준다. 이래야 params.set("sort", …)를 지웠을 때
  // 화면이 아니라 요청 계약에서 걸린다.
  const sortAware = (log: ReturnType<typeof createRequestLog>) =>
    http.get(PRODUCTS_ENDPOINT, ({ request }) => {
      const sort = log.record(request).get("sort");
      if (sort === null) {
        return HttpResponse.json({ message: "sort가 요청에 없다" }, { status: 400 });
      }
      const ordered = [...products].sort((a, b) =>
        sort === "price-desc" ? b.price - a.price : a.price - b.price,
      );
      return HttpResponse.json(
        productListResponse({ products: ordered.slice(0, PAGE_SIZE), totalCount: products.length }),
      );
    });

  it("정렬을 바꾸면 그 정렬이 요청에 실리고 화면 순서가 응답을 따른다", async () => {
    const user = userEvent.setup();
    const log = createRequestLog();
    server.use(sortAware(log));

    // 핸들러가 서비스할 순서를 테스트가 같은 규칙으로 미리 계산한다.
    // 화면이 이것과 같아야 "서버가 준 순서를 그대로 쓴다"가 성립한다 —
    // 다르면 화면이 재배열하는 중복 로직을 가진 것이다.
    const namesByPrice = (direction: "asc" | "desc") =>
      [...products]
        .sort((a, b) => (direction === "desc" ? b.price - a.price : a.price - b.price))
        .slice(0, PAGE_SIZE)
        .map((product) => product.name);

    renderWithProviders(<ProductListPage />, { searchParams: "?sort=price-asc" });

    await screen.findByText(`총 ${products.length}개`);
    expect(log.last().get("sort")).toBe("price-asc");
    expect(renderedNames()).toEqual(namesByPrice("asc"));

    await user.selectOptions(screen.getByLabelText("정렬"), "price-desc");

    await waitFor(() => {
      expect(log.last().get("sort")).toBe("price-desc");
    });
    await waitFor(() => {
      expect(renderedNames()).toEqual(namesByPrice("desc"));
    });
  });

  it("정렬 조건이 요청에서 빠지면 실패로 드러난다", async () => {
    const log = createRequestLog();
    server.use(sortAware(log));

    // 핸들러가 sort 없음을 400으로 만들므로, 요청에 sort가 빠지면
    // 화면이 아니라 여기서 걸린다.
    renderWithProviders(<ProductListPage />);

    await screen.findByText(`총 ${products.length}개`);
    expect(log.last().has("sort")).toBe(true);
  });
});

describe("10번 — 페이지 이동 → 목록 변경", () => {
  const paged = (log: ReturnType<typeof createRequestLog>) =>
    http.get(PRODUCTS_ENDPOINT, ({ request }) => {
      const page = Number(log.record(request).get("page") ?? "1");
      const start = (page - 1) * PAGE_SIZE;
      return HttpResponse.json(
        productListResponse({
          products: products.slice(start, start + PAGE_SIZE),
          totalCount: products.length,
          page,
        }),
      );
    });

  it("다음을 누르면 다음 페이지 조건으로 요청이 나가고 목록이 바뀐다", async () => {
    const user = userEvent.setup();
    const log = createRequestLog();
    server.use(paged(log));

    renderWithProviders(<ProductListPage />);

    await screen.findByText(`총 ${products.length}개`);
    const firstPage = renderedNames();

    await user.click(screen.getByRole("button", { name: "다음" }));

    await waitFor(() => {
      expect(log.last().get("page")).toBe("2");
    });
    await waitFor(() => {
      expect(renderedNames()).not.toEqual(firstPage);
    });
  });

  it("첫 페이지에서는 이전으로 나갈 수 없다", async () => {
    const log = createRequestLog();
    server.use(paged(log));

    renderWithProviders(<ProductListPage />);
    await screen.findByText(`총 ${products.length}개`);

    // 눌리면 page=0 요청이 나가고 mock API는 400을 준다.
    expect(screen.getByRole("button", { name: "이전" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "다음" })).toBeEnabled();
  });

  it("마지막 페이지에서는 다음으로 나갈 수 없다", async () => {
    const log = createRequestLog();
    server.use(paged(log));

    // 30개 · 12개씩 → 3페이지가 마지막이다.
    const lastPage = Math.ceil(products.length / PAGE_SIZE);
    renderWithProviders(<ProductListPage />, { searchParams: `?page=${lastPage}` });
    await screen.findByText(`총 ${products.length}개`);

    expect(screen.getByText(`${lastPage} / ${lastPage}`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다음" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "이전" })).toBeEnabled();
  });
});

describe("11번 — 조작이 URL에 반영 · URL로 재진입", () => {
  it("조작하면 그 조건이 URL에 실리고 기본값은 URL에서 빠진다", async () => {
    const user = userEvent.setup();
    const updates: UrlUpdateEvent[] = [];

    renderWithProviders(<ProductListPage />, {
      searchParams: "?category=all&page=3",
      onUrlUpdate: (event) => updates.push(event),
    });
    await screen.findByText(/총 \d+개/);

    await user.selectOptions(screen.getByLabelText("카테고리"), "fashion");

    await waitFor(() => {
      expect(updates.length).toBeGreaterThan(0);
    });
    const params = updates.at(-1)?.searchParams;

    expect(params?.get("category")).toBe("fashion");

    // 기본값은 nuqs가 URL에서 지운다. page:1로 되돌린 것이 "page=1"이 아니라
    // "키가 없음"으로 나타난다 — 문자열 포함 검사는 ?page=10에도 걸리므로 키로 본다.
    expect(params?.has("page")).toBe(false);
  });

  it("그 URL로 다시 들어오면 같은 화면이 복원된다", async () => {
    const user = userEvent.setup();
    const updates: UrlUpdateEvent[] = [];
    const log = createRequestLog();

    server.use(
      http.get(PRODUCTS_ENDPOINT, ({ request }) => {
        const matched = log.record(request).get("category") === "fashion" ? FASHION : products;
        return HttpResponse.json(
          productListResponse({
            products: matched.slice(0, PAGE_SIZE),
            totalCount: matched.length,
          }),
        );
      }),
    );

    const first = renderWithProviders(<ProductListPage />, {
      onUrlUpdate: (event) => updates.push(event),
    });
    await screen.findByText(`총 ${products.length}개`);

    await user.selectOptions(screen.getByLabelText("카테고리"), "fashion");
    expect(await screen.findByText(`총 ${FASHION.length}개`)).toBeInTheDocument();

    const shared = updates.at(-1)?.queryString ?? "";
    expect(shared).toContain("category=fashion");

    // hasMemory는 같은 마운트 안의 상태 유지다. "재진입"은 마운트를 버려야 한다.
    first.unmount();

    renderWithProviders(<ProductListPage />, { searchParams: shared });

    expect(await screen.findByText(`총 ${FASHION.length}개`)).toBeInTheDocument();
    expect(screen.getByLabelText("카테고리")).toHaveValue("fashion");
    expect(log.last().get("category")).toBe("fashion");
  });
});
