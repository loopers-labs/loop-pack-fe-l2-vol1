// @vitest-environment jsdom
// 주문 목록 섹션 통합 테스트 — 빈 목록/목록 있음을 사용자가 보는 화면으로만 검증한다.
// 접근 가드는 proxy(서버) 담당이라 이 화면은 인증됨을 전제한다(미인증 분기 없음).
// 네트워크는 MSW 로 가로챈다. 기본 핸들러엔 /api/orders 가 없으므로 각 테스트가 server.use 로 등록한다.

import { afterEach, describe, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { QueryClientProvider } from "@tanstack/react-query";
import { OrderListSection } from "@/_pages/orders";
import { makeQueryClient } from "@/shared/api";
import { server } from "@/__tests__/msw/server";

const ORDERS_ENDPOINT = "/api/orders";

function renderOrderList() {
  render(
    <QueryClientProvider client={makeQueryClient()}>
      <OrderListSection />
    </QueryClientProvider>,
  );
}

afterEach(cleanup);

describe("OrderListSection", () => {
  test("주문이 없으면 빈 안내를 보여준다", async () => {
    server.use(
      http.get(ORDERS_ENDPOINT, () => HttpResponse.json({ orders: [] })),
    );

    renderOrderList();

    expect(
      await screen.findByText("아직 주문이 없습니다."),
    ).toBeInTheDocument();
  });

  test("주문이 있으면 주문 항목을 보여준다", async () => {
    const orders = [
      {
        id: "o1",
        createdAt: "2026-01-01T00:00:00.000Z",
        items: [{ productId: "p1", quantity: 2 }],
      },
    ];

    server.use(http.get(ORDERS_ENDPOINT, () => HttpResponse.json({ orders })));

    renderOrderList();

    expect(await screen.findByText("p1 × 2")).toBeInTheDocument();
  });
});
