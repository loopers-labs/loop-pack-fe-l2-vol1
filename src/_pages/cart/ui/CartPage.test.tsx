import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { trackCheckoutClick } from "@/analytics/commerceEvents";
import { useCartStore } from "@/entities/cart";
import { renderWithAppProviders } from "@/shared/testing/renderWithAppProviders";
import { CartPage } from "./CartPage";

vi.mock("@/analytics/commerceEvents", () => ({
  trackCheckoutClick: vi.fn(),
}));

describe("CartPage", () => {
  beforeEach(() => {
    useCartStore.setState({
      cartProductQuantityMap: {},
      selectedCartProductIdMap: {},
      hasHydrated: true,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("장바구니가 비어 있으면 빈 상태와 상품 이동 링크를 보여준다", () => {
    renderWithAppProviders(<CartPage />);

    expect(screen.getByRole("heading", { name: "장바구니", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("장바구니가 비어 있습니다.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "상품 둘러보기" })).toHaveAttribute(
      "href",
      "/products",
    );
    expect(screen.queryByRole("link", { name: "주문하기" })).not.toBeInTheDocument();
  });

  it("주문하기를 누르면 선택한 상품 정보로 주문서 진입 이벤트를 보낸다", async () => {
    useCartStore.setState({
      cartProductQuantityMap: { p1: 2, p2: 1 },
      selectedCartProductIdMap: { p1: true },
      hasHydrated: true,
    });

    renderWithAppProviders(<CartPage />);

    expect(screen.getByText("총 3개")).toBeInTheDocument();
    expect(screen.getByText("선택 2개")).toBeInTheDocument();
    expect(screen.getByRole("listitem", { name: "p1 수량 2" })).toBeInTheDocument();
    expect(screen.getByRole("listitem", { name: "p2 수량 1" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "p1 주문 선택" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "p2 주문 선택" })).not.toBeChecked();
    expect(screen.getByRole("link", { name: "주문하기" })).toHaveAttribute("href", "/order");

    const checkoutLink = screen.getByRole("link", { name: "주문하기" });
    checkoutLink.addEventListener("click", (event) => event.preventDefault());

    await userEvent.click(checkoutLink);

    expect(trackCheckoutClick).toHaveBeenCalledWith({
      items: [{ productId: "p1", quantity: 2 }],
      itemCount: 1,
      totalQuantity: 2,
    });
  });

  it("수량 버튼으로 상품 수량을 늘리고 줄인다", async () => {
    useCartStore.setState({
      cartProductQuantityMap: { p1: 1 },
      selectedCartProductIdMap: { p1: true },
      hasHydrated: true,
    });

    renderWithAppProviders(<CartPage />);

    await userEvent.click(screen.getByRole("button", { name: "p1 수량 증가" }));

    expect(screen.getByText("총 2개")).toBeInTheDocument();
    expect(screen.getByRole("listitem", { name: "p1 수량 2" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "p1 수량 감소" }));
    await userEvent.click(screen.getByRole("button", { name: "p1 수량 감소" }));

    expect(screen.getByText("장바구니가 비어 있습니다.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "주문하기" })).not.toBeInTheDocument();
  });

  it("상품 선택을 모두 해제하면 주문하기 링크를 숨긴다", async () => {
    useCartStore.setState({
      cartProductQuantityMap: { p1: 2 },
      selectedCartProductIdMap: { p1: true },
      hasHydrated: true,
    });

    renderWithAppProviders(<CartPage />);

    await userEvent.click(screen.getByRole("checkbox", { name: "p1 주문 선택" }));

    expect(screen.getByRole("checkbox", { name: "p1 주문 선택" })).not.toBeChecked();
    expect(screen.getByText("선택 0개")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "주문하기" })).not.toBeInTheDocument();
  });
});
