import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CartActionButton } from "./CartActionButton";
import { WishlistActionButton } from "./WishlistActionButton";

describe("product card action buttons", () => {
  afterEach(() => {
    cleanup();
  });

  it("wishlist action은 pressed 상태와 보조 문구를 렌더링한다", () => {
    render(
      <WishlistActionButton
        label="테스트 상품 위시리스트"
        pressed={true}
        disabled={false}
        onClick={() => {}}
      />,
    );

    const button = screen.getByRole("button", { name: "테스트 상품 위시리스트" });

    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button).toHaveTextContent("찜 해제");
  });

  it("cart action은 토글 상태를 노출하지 않고 담기 action만 제공한다", () => {
    render(<CartActionButton label="테스트 상품 장바구니" disabled={false} onClick={() => {}} />);

    const button = screen.getByRole("button", { name: "테스트 상품 장바구니" });

    expect(button).not.toHaveAttribute("aria-pressed");
    expect(button).toHaveTextContent("담기");
  });

  it("버튼을 누르면 전달받은 action을 호출한다", async () => {
    const onWishlistClick = vi.fn();
    const onCartClick = vi.fn();

    render(
      <>
        <WishlistActionButton
          label="테스트 상품 위시리스트"
          pressed={false}
          disabled={false}
          onClick={onWishlistClick}
        />
        <CartActionButton label="테스트 상품 장바구니" disabled={false} onClick={onCartClick} />
      </>,
    );

    await userEvent.click(screen.getByRole("button", { name: "테스트 상품 위시리스트" }));
    await userEvent.click(screen.getByRole("button", { name: "테스트 상품 장바구니" }));

    expect(onWishlistClick).toHaveBeenCalledTimes(1);
    expect(onCartClick).toHaveBeenCalledTimes(1);
  });
});
