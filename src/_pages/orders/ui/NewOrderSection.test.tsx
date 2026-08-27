// @vitest-environment jsdom
// 새 주문 섹션 통합 테스트 — 성공(주문 후 /orders 이동)과 실패(에러 안내·이동 없음)만 검증한다.
// 네트워크는 MSW 로 가로챈다. 기본 핸들러엔 POST /api/orders 가 없으므로
// (onUnhandledRequest:"error") 각 테스트가 자기 응답을 server.use 로 등록한다.
// next/navigation 라우터는 jsdom 에 없어 최소 목으로 대체하고, push 만 스파이로 관찰한다.

import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { QueryClientProvider } from "@tanstack/react-query";
import { NewOrderSection } from "@/_pages/orders";
import { makeQueryClient } from "@/shared/api";
import { server } from "@/__tests__/msw/server";

const ORDERS_ENDPOINT = "/api/orders";
const ORDER_ERROR = "주문에 실패했습니다. 잠시 후 다시 시도해주세요.";
const order = {
  id: "o1",
  createdAt: "2026-01-01T00:00:00.000Z",
  items: [{ productId: "p1", quantity: 2 }],
};

// push 는 주문 성공의 관찰 지점이라 스파이로 잡는다.
const { pushSpy } = vi.hoisted(() => ({ pushSpy: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushSpy }),
}));

function renderNewOrder() {
  render(
    <QueryClientProvider client={makeQueryClient()}>
      <NewOrderSection />
    </QueryClientProvider>,
  );
}

async function submitOrder() {
  await userEvent.clear(screen.getByLabelText("수량"));
  await userEvent.type(screen.getByLabelText("수량"), "2");
  await userEvent.click(screen.getByRole("button", { name: "주문하기" }));
}

afterEach(() => {
  cleanup();
  pushSpy.mockClear();
});

describe("NewOrderSection", () => {
  test("주문 성공 시 목록으로 이동한다", async () => {
    server.use(
      http.post(ORDERS_ENDPOINT, () =>
        HttpResponse.json({ order }, { status: 201 }),
      ),
    );

    renderNewOrder();
    await submitOrder();

    await waitFor(() => expect(pushSpy).toHaveBeenCalledWith("/orders"));
  });

  test("주문 실패 시 에러 안내를 보여주고 이동하지 않는다", async () => {
    server.use(
      http.post(ORDERS_ENDPOINT, () => new HttpResponse(null, { status: 500 })),
    );

    renderNewOrder();
    await submitOrder();

    expect(await screen.findByRole("alert")).toHaveTextContent(ORDER_ERROR);
    expect(pushSpy).not.toHaveBeenCalled();
  });
});
