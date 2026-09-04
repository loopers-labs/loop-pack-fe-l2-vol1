// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { OrderHistory } from "@/features/orders/ui/OrderHistory";
import { renderWithProviders } from "@/test/renderWithProviders";
import { server } from "@/test/server";
import { looperUser, withSession } from "@/test/session";

function renderLoggedIn(ui: React.ReactNode) {
  return renderWithProviders(withSession(looperUser(1), ui));
}

describe("OrderHistory", () => {
  it("로그인 상태면 주문 목록을 보여준다", async () => {
    server.use(
      http.get("*/api/orders", () =>
        HttpResponse.json({
          orders: [
            {
              id: "o1",
              createdAt: "2026-01-01T00:00:00.000Z",
              items: [{ productId: "p1", quantity: 2 }],
            },
          ],
        }),
      ),
    );
    renderLoggedIn(<OrderHistory />);

    expect(await screen.findByText("o1")).toBeInTheDocument();
    expect(screen.getByText("p1 × 2")).toBeInTheDocument();
  });

  it("주문이 없으면 빈 안내를 보인다", async () => {
    server.use(http.get("*/api/orders", () => HttpResponse.json({ orders: [] })));
    renderLoggedIn(<OrderHistory />);

    expect(await screen.findByText("주문 내역이 없습니다.")).toBeInTheDocument();
  });

  it("비로그인이면 조회하지 않는다(enabled 게이트) — 요청이 나가지 않는다", async () => {
    // 로그인 상태(me 값)를 주지 않으면 useOrders의 enabled가 false라 요청 자체가 없다.
    const orders = vi.fn(() => HttpResponse.json({ orders: [] }));
    server.use(http.get("*/api/orders", orders));
    renderWithProviders(<OrderHistory />);

    // pending 상태로 남고, 잠시 뒤에도 요청이 나가지 않았음을 확인한다.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(orders).not.toHaveBeenCalled();
  });
});
