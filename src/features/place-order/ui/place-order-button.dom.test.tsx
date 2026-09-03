import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCartStore } from "@/entities/cart";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render-with-providers";
import { PlaceOrderButton } from "./place-order-button";

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const items = [{ productId: "p1", quantity: 1 }];

describe("PlaceOrderButton", () => {
  beforeEach(() => {
    router.push.mockReset();
    useCartStore.setState({ ids: new Set(["p1"]) });
  });

  it("주문이 만들어지면 주문 내역으로 이동한 뒤 장바구니를 비운다", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlaceOrderButton items={items} />);

    await user.click(screen.getByRole("button", { name: "주문하기" }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/orders"));
    expect(useCartStore.getState().ids.size).toBe(0);
  });

  it("주문이 실패하면 장바구니를 그대로 두고 서버 문구를 보여준다", async () => {
    server.use(
      http.post("/api/orders", () =>
        HttpResponse.json({ message: "요청 조건을 확인해주세요." }, { status: 400 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<PlaceOrderButton items={items} />);

    await user.click(screen.getByRole("button", { name: "주문하기" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("요청 조건을 확인해주세요.");
    expect(router.push).not.toHaveBeenCalled();
    expect(useCartStore.getState().ids.has("p1")).toBe(true);
  });
});
