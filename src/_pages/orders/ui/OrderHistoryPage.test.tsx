import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { OrderHistoryPage } from "./OrderHistoryPage";
import { server } from "@/shared/config/vitest/mswServer";
import { renderWithAppProviders } from "@/shared/testing/renderWithAppProviders";

const queryRetryTimeout = { timeout: 3000 };

describe("OrderHistoryPage", () => {
  afterEach(() => {
    cleanup();
  });

  it("주문 내역을 불러오는 동안 로딩 상태를 보여준다", () => {
    server.use(http.get("/api/orders", () => new Promise(() => undefined)));

    renderWithAppProviders(<OrderHistoryPage />);

    expect(screen.getByRole("heading", { name: "주문 내역", level: 1 })).toBeInTheDocument();
    expect(screen.getByLabelText("주문 내역을 불러오는 중입니다.")).toBeInTheDocument();
  });

  it("주문 내역이 없으면 빈 상태를 보여준다", async () => {
    server.use(http.get("/api/orders", () => HttpResponse.json({ orders: [] })));

    renderWithAppProviders(<OrderHistoryPage />);

    expect(await screen.findByText("아직 주문 내역이 없습니다.")).toBeInTheDocument();
  });

  it("주문 내역이 있으면 주문 번호와 상품 수량을 보여준다", async () => {
    server.use(
      http.get("/api/orders", () =>
        HttpResponse.json({
          orders: [
            {
              id: "o1",
              createdAt: "2026-08-29T00:00:00.000Z",
              items: [
                { productId: "p1", quantity: 2 },
                { productId: "p2", quantity: 1 },
              ],
            },
          ],
        }),
      ),
    );

    renderWithAppProviders(<OrderHistoryPage />);

    expect(await screen.findByRole("article", { name: "주문 o1" })).toBeInTheDocument();
    expect(screen.getByText("2026. 8. 29. 오전 9:00")).toBeInTheDocument();
    expect(screen.getByText("상품 2종 · 총 3개")).toBeInTheDocument();
    expect(screen.getByText("p1 2개")).toBeInTheDocument();
    expect(screen.getByText("p2 1개")).toBeInTheDocument();
  });

  it("주문 내역 조회가 실패하면 에러 메시지와 다시 시도 버튼을 보여준다", async () => {
    let requestCount = 0;
    server.use(
      http.get("/api/orders", () => {
        requestCount += 1;

        return HttpResponse.json({ message: "주문 내역을 불러오지 못했습니다." }, { status: 500 });
      }),
    );

    renderWithAppProviders(<OrderHistoryPage />);

    expect(
      await screen.findByText("주문 내역을 불러오지 못했습니다.", {}, queryRetryTimeout),
    ).toBeInTheDocument();
    expect(requestCount).toBe(2);

    await userEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    await waitFor(() => {
      expect(requestCount).toBeGreaterThan(2);
    });
  });
});
