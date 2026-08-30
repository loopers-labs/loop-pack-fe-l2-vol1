import { afterEach, describe, expect, it, vi } from "vitest";
import { resetAnalyticsForTest, track } from "./logger";
import {
  trackCartAdd,
  trackLoginSuccess,
  trackOrderComplete,
  trackProductListView,
} from "./commerceEvents";

vi.mock("./logger", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./logger")>();

  return {
    ...actual,
    track: vi.fn(),
  };
});

describe("commerce analytics events", () => {
  afterEach(() => {
    resetAnalyticsForTest();
    vi.mocked(track).mockClear();
  });

  it("상품 목록 진입 이벤트는 시드 로그 이름과 목록 조건을 함께 보낸다", () => {
    trackProductListView({
      q: "bag",
      category: "goods",
      sort: "popular",
      page: 2,
    });

    expect(track).toHaveBeenCalledWith("product_list_view", {
      q: "bag",
      category: "goods",
      sort: "popular",
      page: 2,
    });
  });

  it("상품 카드 담기 이벤트는 담긴 뒤의 상품별 수량을 보낸다", () => {
    trackCartAdd({ productId: "p1", quantity: 2 });

    expect(track).toHaveBeenCalledWith("cart_add", { productId: "p1", quantity: 2 });
  });

  it("로그인 성공 이벤트는 사용자 식별과 별도로 복원 경로만 보낸다", () => {
    trackLoginSuccess({ redirectTo: "/orders" });

    expect(track).toHaveBeenCalledWith("login_success", { redirectTo: "/orders" });
  });

  it("주문 완료 이벤트는 주문 id와 상품별 수량을 함께 보낸다", () => {
    trackOrderComplete({
      orderId: "o1",
      items: [
        { productId: "p1", quantity: 2 },
        { productId: "p3", quantity: 1 },
      ],
      itemCount: 2,
      totalQuantity: 3,
    });

    expect(track).toHaveBeenCalledWith("order_complete", {
      orderId: "o1",
      items: [
        { productId: "p1", quantity: 2 },
        { productId: "p3", quantity: 1 },
      ],
      itemCount: 2,
      totalQuantity: 3,
    });
  });
});
