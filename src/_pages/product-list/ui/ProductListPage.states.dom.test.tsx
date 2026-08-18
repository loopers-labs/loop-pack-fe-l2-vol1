import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, delay, http } from "msw";
import { describe, expect, it } from "vitest";
import { PRODUCTS_ENDPOINT, productListResponse } from "@/mocks/handlers";
import { server } from "@/mocks/server";
import { BOUNDARY_FALLBACK, TestErrorBoundary, renderWithProviders } from "@/test/render";
import { ProductListPage } from "./ProductListPage";

// 4·5·6·7번 항목 — 목록의 네 가지 상태.
// 기본 핸들러는 성공 경로만 두고, 실패·지연·빈 결과는 각 테스트가 여기서 덮는다.

const listRegion = () => screen.getByRole("region", { name: "상품 검색 결과" });

describe("4번 — 목록 로딩 → 성공", () => {
  it("응답을 기다리는 동안 불러오는 중임을 알리고, 도착하면 목록으로 바꾼다", async () => {
    server.use(
      http.get(PRODUCTS_ENDPOINT, async () => {
        await delay(50);
        return HttpResponse.json(productListResponse());
      }),
    );

    renderWithProviders(<ProductListPage />);

    // 최초 로딩 문구에는 role이 없다. 상태는 감싼 region의 aria-busy가 갖는다.
    expect(screen.getByText(/불러오는 중/)).toBeInTheDocument();
    expect(listRegion()).toHaveAttribute("aria-busy", "true");

    expect(await screen.findByText(/총 \d+개/)).toBeInTheDocument();

    // 도착한 뒤에는 대기 표시가 남아 있으면 안 된다.
    expect(screen.queryByText(/불러오는 중/)).not.toBeInTheDocument();
    expect(listRegion()).toHaveAttribute("aria-busy", "false");
  });

  it("1.5초 창에서도 대기 표시가 유지되고 그 뒤 목록이 나온다", async () => {
    // 7주차에 "1.5초 pending을 라이브로 재현하지 않았다"고 지적받은 창이다.
    // mock API의 scenario=slow와 같은 1,500ms를 MSW가 만든다.
    server.use(
      http.get(PRODUCTS_ENDPOINT, async () => {
        await delay(1_500);
        return HttpResponse.json(productListResponse());
      }),
    );

    renderWithProviders(<ProductListPage />);

    // 창 중간(1초 시점)에도 여전히 대기 중이어야 한다 — 조기에 빈 화면이 되면 안 된다.
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    expect(screen.getByText(/불러오는 중/)).toBeInTheDocument();
    expect(listRegion()).toHaveAttribute("aria-busy", "true");

    expect(await screen.findByText(/총 \d+개/, undefined, { timeout: 3_000 })).toBeInTheDocument();
  }, 10_000);
});

describe("5번 — 목록 빈 결과", () => {
  it("0건이면 어떤 조건으로 걸러 0건인지 URL 조건을 그대로 적는다", async () => {
    server.use(
      http.get(PRODUCTS_ENDPOINT, () =>
        HttpResponse.json(productListResponse({ products: [], totalCount: 0 })),
      ),
    );

    renderWithProviders(<ProductListPage />, { searchParams: "?q=없는상품&category=fashion" });

    expect(
      await screen.findByText('검색어 "없는상품" · 카테고리 패션에 맞는 상품이 없습니다. (0개)'),
    ).toBeInTheDocument();

    // 0건에 그리드·페이지네이션이 남으면 빈 자리가 목록처럼 보인다.
    expect(screen.queryByText(/총 \d+개/)).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "페이지 이동" })).not.toBeInTheDocument();
  });

  it("조건이 하나도 없을 때 0건이면 전체 조건이라고 적는다", async () => {
    server.use(
      http.get(PRODUCTS_ENDPOINT, () =>
        HttpResponse.json(productListResponse({ products: [], totalCount: 0 })),
      ),
    );

    renderWithProviders(<ProductListPage />);

    expect(await screen.findByText("전체 조건에 맞는 상품이 없습니다. (0개)")).toBeInTheDocument();
  });
});

describe("6번 — 목록 에러", () => {
  it("400이면 목록 자리에 실패 이유와 재시도를 두고, 필터는 살려 둔다", async () => {
    server.use(
      http.get(PRODUCTS_ENDPOINT, () =>
        HttpResponse.json({ message: "요청 조건을 확인해주세요." }, { status: 400 }),
      ),
    );

    renderWithProviders(<ProductListPage />, { searchParams: "?page=0" });

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/검색 조건을 확인해 주세요/);
    expect(within(alert).getByRole("button", { name: "다시 시도" })).toBeInTheDocument();

    // 조건을 바꿔 빠져나갈 수 있어야 한다 — 필터가 사라지면 사용자가 갇힌다.
    expect(screen.getByLabelText("카테고리")).toBeInTheDocument();
    expect(screen.getByLabelText("정렬")).toBeInTheDocument();
  });

  it("500이면 화면 안에 두지 않고 경계로 전파한다", async () => {
    // 400만 검증하면 throwOnError를 () => false로 바꿔도 초록불이다.
    // 재시도해도 해결되지 않는 실패에 "다시 시도"를 주는 것이 여기서 걸린다.
    server.use(
      http.get(PRODUCTS_ENDPOINT, () =>
        HttpResponse.json({ message: "상품 목록을 불러오지 못했습니다." }, { status: 500 }),
      ),
    );

    renderWithProviders(
      <TestErrorBoundary>
        <ProductListPage />
      </TestErrorBoundary>,
    );

    expect(await screen.findByText(BOUNDARY_FALLBACK)).toBeInTheDocument();
    expect(screen.queryByText(/검색 조건을 확인해 주세요/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "다시 시도" })).not.toBeInTheDocument();
  });

  it("네트워크가 실패해도 경계로 전파한다", async () => {
    // HttpError가 아닌 실패(TypeError)다. isServerFault가 true를 주는 경로.
    server.use(http.get(PRODUCTS_ENDPOINT, () => HttpResponse.error()));

    renderWithProviders(
      <TestErrorBoundary>
        <ProductListPage />
      </TestErrorBoundary>,
    );

    expect(await screen.findByText(BOUNDARY_FALLBACK)).toBeInTheDocument();
  });
});

describe("7번 — 에러에서 재시도로 복구", () => {
  it("실패한 뒤 다시 시도를 누르면 목록이 나오고 에러 표시가 사라진다", async () => {
    const user = userEvent.setup();

    // 첫 요청만 실패시킨다(once). 그 뒤엔 기본 성공 핸들러가 받는다 —
    // 재시도가 "같은 조건으로 다시 나갔는가"를 보려면 응답 두 개의 순서가 필요하다.
    server.use(
      http.get(
        PRODUCTS_ENDPOINT,
        () => HttpResponse.json({ message: "요청 조건을 확인해주세요." }, { status: 400 }),
        { once: true },
      ),
    );

    renderWithProviders(<ProductListPage />);

    const alert = await screen.findByRole("alert");
    await user.click(within(alert).getByRole("button", { name: "다시 시도" }));

    expect(await screen.findByText(/총 \d+개/)).toBeInTheDocument();

    // 성공과 실패가 동시에 보이면 안 된다.
    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
