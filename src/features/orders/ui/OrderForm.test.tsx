// @vitest-environment jsdom
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCartStore } from "@/entities/cart/model/cartStore";
import { OrderForm } from "@/features/orders/ui/OrderForm";
import { routerMock as router } from "@/test/navigation";
import { renderWithProviders } from "@/test/renderWithProviders";
import { server } from "@/test/server";

// next/navigation은 setup.ts에서 전역 목킹한다. router 호출은 그 목 실체(routerMock)로 검증한다.
const trackEvent = vi.hoisted(() => vi.fn());
vi.mock("@/analytics/schema", () => ({ trackEvent }));

beforeEach(async () => {
  router.push.mockClear();
  trackEvent.mockClear();
  // 하이드레이션을 끝내 "복원 중" 분기를 지나게 하고, cart를 원하는 상태로 세운다.
  await useCartStore.persist.rehydrate();
  useCartStore.setState({ cartIds: [] });
});

describe("OrderForm", () => {
  it("담은 상품이 없으면 안내를 보인다", () => {
    renderWithProviders(<OrderForm />);
    expect(screen.getByText("담은 상품이 없습니다.")).toBeInTheDocument();
  });

  it("주문하면 담은 상품을 수량 1로 보내고, 성공 뒤 장바구니를 비우고 주문내역으로 이동한다", async () => {
    let requestBody: unknown;
    server.use(
      http.post("*/api/orders", async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json(
          { order: { id: "o1", createdAt: "2026-01-01T00:00:00.000Z", items: [] } },
          { status: 201 },
        );
      }),
    );
    useCartStore.setState({ cartIds: ["p1", "p2"] });
    const user = userEvent.setup();
    renderWithProviders(<OrderForm />);

    await user.click(screen.getByRole("button", { name: "주문하기" }));

    await vi.waitFor(() => expect(router.push).toHaveBeenCalledWith("/orders"));
    expect(requestBody).toEqual({
      items: [
        { productId: "p1", quantity: 1 },
        { productId: "p2", quantity: 1 },
      ],
    });
    // 성공 뒤 장바구니가 비워진다.
    expect(useCartStore.getState().cartIds).toEqual([]);
  });
});

describe("OrderForm 계측 — order_start 발화 조건", () => {
  it("담은 상품이 있으면 진입 시 order_start를 담긴 productIds와 함께 1회 찍는다", () => {
    useCartStore.setState({ cartIds: ["p1", "p2"] });
    renderWithProviders(<OrderForm />);

    expect(trackEvent).toHaveBeenCalledExactlyOnceWith("order_start", {
      productIds: ["p1", "p2"],
    });
  });

  it("빈 장바구니로 진입하면 order_start를 찍지 않는다", () => {
    // cart가 비어 있으면 주문 시작이 아니므로 찍지 않는다(빈 productIds가 새어 나가지 않게).
    renderWithProviders(<OrderForm />);

    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("장바구니가 바뀌어 리렌더돼도 order_start를 중복해서 찍지 않는다", () => {
    useCartStore.setState({ cartIds: ["p1"] });
    renderWithProviders(<OrderForm />);
    expect(trackEvent).toHaveBeenCalledOnce();

    // cart 상태 변화로 컴포넌트가 다시 렌더돼도, 이미 찍은 order_start는 다시 나가지 않는다.
    act(() => useCartStore.setState({ cartIds: ["p1", "p2"] }));

    expect(trackEvent).toHaveBeenCalledExactlyOnceWith("order_start", { productIds: ["p1"] });
  });

  it("주문에 성공하면 order_complete를 담겼던 productIds와 함께 찍는다", async () => {
    server.use(
      http.post("*/api/orders", () =>
        HttpResponse.json(
          { order: { id: "o1", createdAt: "2026-01-01T00:00:00.000Z", items: [] } },
          { status: 201 },
        ),
      ),
    );
    useCartStore.setState({ cartIds: ["p1", "p2"] });
    const user = userEvent.setup();
    renderWithProviders(<OrderForm />);

    await user.click(screen.getByRole("button", { name: "주문하기" }));

    await vi.waitFor(() =>
      expect(trackEvent).toHaveBeenCalledWith("order_complete", { productIds: ["p1", "p2"] }),
    );
  });
});
