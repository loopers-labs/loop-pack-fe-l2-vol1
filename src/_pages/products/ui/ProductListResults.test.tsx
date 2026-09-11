// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { ProductListResults } from "@/_pages/products/ui/ProductListResults";
import { makeProduct, makeProductListResponse } from "@/test/handlers";
import { renderWithProviders } from "@/test/renderWithProviders";
import { server } from "@/test/server";

function renderResults() {
  return renderWithProviders(<ProductListResults />).client;
}

describe("ProductListResults data 우선 — 배경 실패는 목록을 덮지 않는다", () => {
  it("목록을 보여주는 중 배경 재조회가 5xx로 실패해도 목록은 유지되고 배너로만 알린다", async () => {
    server.use(
      http.get("*/api/products", () =>
        HttpResponse.json(makeProductListResponse({ products: [makeProduct({ name: "가디건" })] })),
      ),
    );

    const client = renderResults();

    // 첫 조회 성공: 목록이 그려진다.
    expect(await screen.findByText("가디건")).toBeInTheDocument();

    // 배경 재조회를 5xx로 실패시킨다. 이미 데이터가 있어 경계로 던지지 않는다.
    server.use(
      http.get("*/api/products", () =>
        HttpResponse.json({ message: "서버 오류" }, { status: 500 }),
      ),
    );
    await client.refetchQueries().catch(() => undefined);

    // 목록은 그대로 있고, 배너(다시 시도)만 뜬다.
    expect(await screen.findByRole("button", { name: "다시 시도" })).toBeInTheDocument();
    expect(screen.getByText("가디건")).toBeInTheDocument();
  });

  it("배너의 다시 시도를 누르면 재조회가 성공으로 이어져 배너가 사라진다", async () => {
    const success = () =>
      HttpResponse.json(makeProductListResponse({ products: [makeProduct({ name: "가디건" })] }));
    server.use(http.get("*/api/products", success));
    const client = renderResults();
    expect(await screen.findByText("가디건")).toBeInTheDocument();

    // 배경 재조회가 실패해 다시 시도 배너가 뜬다.
    server.use(
      http.get("*/api/products", () =>
        HttpResponse.json({ message: "서버 오류" }, { status: 500 }),
      ),
    );
    await client.refetchQueries().catch(() => undefined);
    const retry = await screen.findByRole("button", { name: "다시 시도" });

    // 다시 시도를 누르면 성공 핸들러로 되돌린 재조회가 성공해, 배너는 사라지고 목록은 남는다.
    server.use(http.get("*/api/products", success));
    fireEvent.click(retry);
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "다시 시도" })).not.toBeInTheDocument(),
    );
    expect(screen.getByText("가디건")).toBeInTheDocument();
  });
});

describe("ProductListResults 상태 표시", () => {
  it("첫 조회가 4xx로 실패하면(보여줄 데이터 없음) 결과 영역에 에러 메시지를 인라인으로 보인다", async () => {
    // 4xx는 서버 오류가 아니라 던지지 않는다(경계로 안 감). 데이터가 없으니 인라인 에러.
    server.use(
      http.get("*/api/products", () =>
        HttpResponse.json({ message: "요청 조건을 확인해주세요." }, { status: 400 }),
      ),
    );

    renderResults();

    expect(await screen.findByText("요청 조건을 확인해주세요.")).toBeInTheDocument();
  });

  it("네트워크 실패도 경계가 아니라 인라인 에러로 보인다", async () => {
    // 네트워크 실패는 서버 오류(5xx)가 아니라 던지지 않는다. 데이터가 없으니 인라인.
    server.use(http.get("*/api/products", () => HttpResponse.error()));

    renderResults();

    expect(await screen.findByText("네트워크 연결을 확인해 주세요.")).toBeInTheDocument();
  });

  it("결과가 없으면 '조건에 맞는 상품이 없습니다.'를 보인다", async () => {
    server.use(
      http.get("*/api/products", () =>
        HttpResponse.json(makeProductListResponse({ products: [], totalCount: 0 })),
      ),
    );

    renderResults();

    expect(await screen.findByText("조건에 맞는 상품이 없습니다.")).toBeInTheDocument();
  });

  it("로딩 동안은 목록이 없다가, 성공 응답이 오면 목록으로 전이한다", async () => {
    server.use(
      http.get("*/api/products", () =>
        HttpResponse.json(makeProductListResponse({ products: [makeProduct({ name: "가디건" })] })),
      ),
    );

    renderResults();

    // 로딩 중엔 아직 상품이 없다(스켈레톤은 aria-hidden이라 접근성 트리에 안 보인다).
    expect(screen.queryByText("가디건")).not.toBeInTheDocument();
    // 성공하면 목록으로 전이한다.
    expect(await screen.findByText("가디건")).toBeInTheDocument();
  });
});
