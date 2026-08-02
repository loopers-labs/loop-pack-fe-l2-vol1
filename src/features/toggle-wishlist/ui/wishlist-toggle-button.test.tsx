import { afterEach, beforeEach, describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { cleanup, render, screen } from "../../../../mocks/render";
import { WishlistToggleButton } from "./wishlist-toggle-button";
import { useWishlistStore } from "../model/store";

afterEach(cleanup);
beforeEach(() => {
  useWishlistStore.setState({ wishlistIds: new Set() });
});

const PRODUCT = { id: "p1", name: "스탠리 클래식 런치박스" };

describe("WishlistToggleButton", () => {
  it("상품명 기반 접근 이름과 false의 초기 aria-pressed를 제공한다", () => {
    render(<WishlistToggleButton productId={PRODUCT.id} productName={PRODUCT.name} />);

    expect(screen.getByRole("button", { name: `${PRODUCT.name} 위시리스트` })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("클릭하면 aria-pressed가 토글된다", async () => {
    const user = userEvent.setup();
    render(<WishlistToggleButton productId={PRODUCT.id} productName={PRODUCT.name} />);
    const button = screen.getByRole("button", { name: `${PRODUCT.name} 위시리스트` });

    await user.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");
    await user.click(button);
    expect(button).toHaveAttribute("aria-pressed", "false");
  });
});
