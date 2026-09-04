// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useWishlistStore } from "@/entities/wishlist/model/wishlistStore";
import { WishlistButton } from "@/features/toggle-wishlist/ui/WishlistButton";

const trackEvent = vi.hoisted(() => vi.fn());
vi.mock("@/analytics/schema", () => ({ trackEvent }));

beforeEach(() => {
  trackEvent.mockClear();
  useWishlistStore.setState({ wishlistIds: [] });
});
afterEach(() => vi.restoreAllMocks());

describe("WishlistButton 계측", () => {
  it("찜을 추가할 때 wishlist_add를 productId와 함께 찍는다", async () => {
    const user = userEvent.setup();
    render(<WishlistButton productId="p2" productName="테스트 상품" />);

    await user.click(screen.getByRole("button"));

    expect(trackEvent).toHaveBeenCalledExactlyOnceWith("wishlist_add", { productId: "p2" });
  });

  it("이미 찜한 상품을 해제하면 wishlist_add를 찍지 않는다", async () => {
    useWishlistStore.setState({ wishlistIds: ["p2"] });
    const user = userEvent.setup();
    render(<WishlistButton productId="p2" productName="테스트 상품" />);

    await user.click(screen.getByRole("button"));

    expect(trackEvent).not.toHaveBeenCalled();
  });
});
