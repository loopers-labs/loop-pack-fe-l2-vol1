// @vitest-environment jsdom
// 주문서 통합 테스트 — 카트에 담긴 상품을 수량 1로 주문하고(성공 시 카트 비우고 /orders 이동),
// 실패 시 안내·카트 유지, 빈 카트면 버튼 비활성만 검증한다.
// 네트워크는 MSW 로 가로챈다. 기본 핸들러엔 POST /api/orders 가 없으므로
// (onUnhandledRequest:"error") 각 테스트가 자기 응답을 server.use 로 등록한다.
// next/navigation 라우터는 jsdom 에 없어 최소 목으로 대체하고, push 만 스파이로 관찰한다.

import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { QueryClientProvider } from "@tanstack/react-query";
import { NewOrderSection } from "@/_pages/orders";
import { useCartStore } from "@/entities/cart";
import { makeQueryClient } from "@/shared/api";
import { server } from "@/__tests__/msw/server";

const ORDERS_ENDPOINT = "/api/orders";
const ORDER_ERROR = "주문에 실패했습니다. 잠시 후 다시 시도해주세요.";

// push 는 주문 성공의 관찰 지점이라 스파이로 잡는다.
const { pushSpy } = vi.hoisted(() => ({ pushSpy: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushSpy }),
}));

function seedCart(ids: string[]) {
  useCartStore.setState({ ids: new Set(ids), hasHydrated: true });
}

function renderNewOrder() {
  render(
    <QueryClientProvider client={makeQueryClient()}>
      <NewOrderSection />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  pushSpy.mockClear();
  useCartStore.setState({ ids: new Set(), hasHydrated: false });
});

describe("NewOrderSection", () => {
  test("담긴 상품을 수량 1로 주문하고, 성공 시 카트를 비우고 목록으로 이동한다", async () => {
    let posted: unknown;
    server.use(
      http.post(ORDERS_ENDPOINT, async ({ request }) => {
        posted = await request.json();

        return HttpResponse.json(
          {
            order: {
              id: "o1",
              createdAt: "2026-01-01T00:00:00.000Z",
              items: [],
            },
          },
          { status: 201 },
        );
      }),
    );
    seedCart(["p1", "p2"]);
    renderNewOrder();

    await userEvent.click(screen.getByRole("button", { name: "주문하기" }));

    await waitFor(() => expect(pushSpy).toHaveBeenCalledWith("/orders"));
    expect(posted).toEqual({
      items: [
        { productId: "p1", quantity: 1 },
        { productId: "p2", quantity: 1 },
      ],
    });
    expect(useCartStore.getState().ids.size).toBe(0);
  });

  test("주문 실패 시 안내를 보여주고, 이동하지 않으며 카트를 유지한다", async () => {
    server.use(
      http.post(ORDERS_ENDPOINT, () => new HttpResponse(null, { status: 500 })),
    );
    seedCart(["p1"]);
    renderNewOrder();

    await userEvent.click(screen.getByRole("button", { name: "주문하기" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(ORDER_ERROR);
    expect(pushSpy).not.toHaveBeenCalled();
    expect(useCartStore.getState().ids.size).toBe(1);
  });

  test("카트가 비어 있으면 주문 버튼이 비활성화된다", () => {
    seedCart([]);
    renderNewOrder();

    expect(screen.getByRole("button", { name: "주문하기" })).toBeDisabled();
  });
});
