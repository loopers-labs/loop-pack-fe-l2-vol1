import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OrderPage } from "./OrderPage";
import { useCartStore } from "@/entities/cart";
import { server } from "@/shared/config/vitest/mswServer";
import { renderWithAppProviders } from "@/shared/testing/renderWithAppProviders";

const routerPush = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPush,
  }),
}));

describe("OrderPage", () => {
  beforeEach(() => {
    useCartStore.setState({
      cartProductQuantityMap: {},
      selectedCartProductIdMap: {},
      hasHydrated: true,
    });
  });

  afterEach(() => {
    cleanup();
    routerPush.mockReset();
  });

  it("선택한 장바구니 상품이 있으면 주문 수량과 주문 완료 버튼을 보여준다", () => {
    useCartStore.setState({
      cartProductQuantityMap: { p1: 2, p2: 1 },
      selectedCartProductIdMap: { p1: true },
      hasHydrated: true,
    });

    renderWithAppProviders(<OrderPage />);

    expect(screen.getByRole("heading", { name: "주문서", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("총 2개")).toBeInTheDocument();
    expect(screen.getByRole("listitem", { name: "p1 수량 2" })).toBeInTheDocument();
    expect(screen.queryByRole("listitem", { name: "p2 수량 1" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "주문 완료" })).toBeEnabled();
  });

  it("선택한 장바구니 상품이 없으면 장바구니로 돌아가는 링크를 보여준다", () => {
    useCartStore.setState({
      cartProductQuantityMap: { p1: 1 },
      selectedCartProductIdMap: {},
      hasHydrated: true,
    });

    renderWithAppProviders(<OrderPage />);

    expect(screen.getByText("주문할 상품이 없습니다.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "장바구니로 돌아가기" })).toHaveAttribute(
      "href",
      "/cart",
    );
    expect(screen.queryByRole("button", { name: "주문 완료" })).not.toBeInTheDocument();
  });

  it("주문 완료를 누르면 장바구니 상품을 주문하고 주문 내역으로 이동한다", async () => {
    let requestBody: unknown;
    useCartStore.setState({
      cartProductQuantityMap: { p1: 2, p2: 1 },
      selectedCartProductIdMap: { p1: true },
      hasHydrated: true,
    });
    server.use(
      http.post("/api/orders", async ({ request }) => {
        requestBody = await request.json();

        return HttpResponse.json(
          {
            order: {
              id: "o1",
              createdAt: "2026-08-29T00:00:00.000Z",
              items: [{ productId: "p1", quantity: 2 }],
            },
          },
          { status: 201 },
        );
      }),
    );

    renderWithAppProviders(<OrderPage />);

    await userEvent.click(screen.getByRole("button", { name: "주문 완료" }));

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith("/orders");
    });
    expect(requestBody).toEqual({
      items: [{ productId: "p1", quantity: 2 }],
    });
    expect(useCartStore.getState().cartProductQuantityMap).toEqual({ p2: 1 });
    expect(useCartStore.getState().selectedCartProductIdMap).toEqual({});
  });

  it("주문 실패 응답을 받으면 API 메시지를 보여주고 장바구니는 유지한다", async () => {
    useCartStore.setState({
      cartProductQuantityMap: { p1: 1, p2: 1 },
      selectedCartProductIdMap: { p1: true },
      hasHydrated: true,
    });
    server.use(
      http.post("/api/orders", () =>
        HttpResponse.json({ message: "요청 조건을 확인해주세요." }, { status: 400 }),
      ),
    );

    renderWithAppProviders(<OrderPage />);

    await userEvent.click(screen.getByRole("button", { name: "주문 완료" }));

    expect(await screen.findByText("요청 조건을 확인해주세요.")).toBeInTheDocument();
    expect(routerPush).not.toHaveBeenCalled();
    expect(useCartStore.getState().cartProductQuantityMap).toEqual({ p1: 1, p2: 1 });
    expect(useCartStore.getState().selectedCartProductIdMap).toEqual({ p1: true });
  });
});
