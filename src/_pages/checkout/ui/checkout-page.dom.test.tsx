import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCartStore } from "@/entities/cart";
import { renderWithProviders } from "@/test/render-with-providers";
import { CheckoutPage } from "./checkout-page";

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

describe("CheckoutPage", () => {
  beforeEach(() => {
    router.push.mockReset();
  });

  it("장바구니가 비어 있으면 주문 버튼 대신 상품 목록 링크를 보여준다", () => {
    renderWithProviders(<CheckoutPage />);

    expect(screen.getByText("장바구니가 비어 있어요")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "상품 보러 가기" })).toHaveAttribute(
      "href",
      "/products",
    );
    expect(screen.queryByRole("button", { name: "주문하기" })).not.toBeInTheDocument();
  });

  it("담은 상품의 이름·금액을 보여주고, 주문하면 화면이 빈 장바구니로 바뀐 뒤에도 주문 내역으로 이동한다", async () => {
    // 5단계 실험 5′ 가 잡아낸 공백 — 주문 성공으로 장바구니가 비면 이 화면은 빈 상태 분기로 바뀌며 버튼이
    // 언마운트된다. 이동이 그 언마운트에 가려지지 않아야 한다 (버튼만 렌더하는 테스트로는 재현되지 않는다)
    useCartStore.setState({ ids: new Set(["casual-1", "fashion-2"]) });
    const user = userEvent.setup();
    renderWithProviders(<CheckoutPage />);

    const lines = await screen.findByRole("list", { name: "주문 상품" });
    expect(lines).toHaveTextContent("casual-1");
    expect(lines).toHaveTextContent("fashion-2");
    expect(screen.getByText("총 결제 금액").parentElement).toHaveTextContent(
      `${(1000 + 7000).toLocaleString()}원`,
    );

    await user.click(screen.getByRole("button", { name: "주문하기" }));

    await waitFor(() => expect(screen.getByText("장바구니가 비어 있어요")).toBeInTheDocument());
    expect(router.push).toHaveBeenCalledWith("/orders");
    expect(useCartStore.getState().ids.size).toBe(0);
  });
});
