// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCartStore } from "@/entities/cart/model/cartStore";
import { AddToCartButton } from "@/features/add-to-cart/ui/AddToCartButton";

const trackEvent = vi.hoisted(() => vi.fn());
vi.mock("@/analytics/schema", () => ({ trackEvent }));

beforeEach(() => {
  trackEvent.mockClear();
  useCartStore.setState({ cartIds: [] });
});
afterEach(() => vi.restoreAllMocks());

describe("AddToCartButton 계측", () => {
  it("담을 때 cart_add를 productId와 함께 찍는다", async () => {
    const user = userEvent.setup();
    render(<AddToCartButton productId="p1" productName="테스트 상품" />);

    await user.click(screen.getByRole("button"));

    expect(trackEvent).toHaveBeenCalledExactlyOnceWith("cart_add", { productId: "p1" });
  });

  it("이미 담긴 상품을 빼면 cart_add를 찍지 않는다", async () => {
    useCartStore.setState({ cartIds: ["p1"] });
    const user = userEvent.setup();
    render(<AddToCartButton productId="p1" productName="테스트 상품" />);

    await user.click(screen.getByRole("button"));

    expect(trackEvent).not.toHaveBeenCalled();
  });
});
