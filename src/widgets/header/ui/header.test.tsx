import { afterEach, beforeEach, describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { cleanup, render, screen } from "../../../../mocks/render";
import { AddToCartButton } from "@/features/add-to-cart";
import { WishlistToggleButton } from "@/features/toggle-wishlist";
import { Header } from "./header";

const CART_PRODUCTS = [
  { id: "cart-a", name: "장바구니 A" },
  { id: "cart-b", name: "장바구니 B" },
  { id: "cart-c", name: "장바구니 C" },
];
const WISHLIST_PRODUCT = { id: "wishlist-a", name: "위시리스트 A" };

const renderHeaderWithButtons = () => {
  const user = userEvent.setup();
  render(
    <>
      <Header />
      {CART_PRODUCTS.map((product) => (
        <AddToCartButton key={product.id} productId={product.id} productName={product.name} />
      ))}
      <WishlistToggleButton productId={WISHLIST_PRODUCT.id} productName={WISHLIST_PRODUCT.name} />
    </>,
  );
  return user;
};

afterEach(cleanup);
beforeEach(async () => {
  const user = renderHeaderWithButtons();

  for (const product of CART_PRODUCTS) {
    const button = screen.getByRole("button", { name: `${product.name} 장바구니` });
    if (button.getAttribute("aria-pressed") === "true") {
      await user.click(button);
    }
  }
  const wishlistButton = screen.getByRole("button", {
    name: `${WISHLIST_PRODUCT.name} 위시리스트`,
  });
  if (wishlistButton.getAttribute("aria-pressed") === "true") {
    await user.click(wishlistButton);
  }
  cleanup();
});

describe("Header", () => {
  it("초기 장바구니와 위시리스트 개수를 렌더링한다", () => {
    renderHeaderWithButtons();

    expect(screen.getByText("장바구니 0")).toBeInTheDocument();
    expect(screen.getByText("위시리스트 0")).toBeInTheDocument();
  });

  it("담기 두 번과 찜 한 번 뒤의 개수를 반영한다", async () => {
    const user = renderHeaderWithButtons();

    await user.click(screen.getByRole("button", { name: "장바구니 A 장바구니" }));
    await user.click(screen.getByRole("button", { name: "장바구니 B 장바구니" }));
    await user.click(screen.getByRole("button", { name: "위시리스트 A 위시리스트" }));

    expect(screen.getByText("장바구니 2")).toBeInTheDocument();
    expect(screen.getByText("위시리스트 1")).toBeInTheDocument();
  });

  it("장바구니와 위시리스트 개수를 독립적으로 유지한다", async () => {
    const user = renderHeaderWithButtons();

    for (const product of CART_PRODUCTS) {
      await user.click(screen.getByRole("button", { name: `${product.name} 장바구니` }));
    }

    expect(screen.getByText("장바구니 3")).toBeInTheDocument();
    expect(screen.getByText("위시리스트 0")).toBeInTheDocument();
  });

  it("상품 링크를 기존 접근 이름으로 렌더링한다", () => {
    renderHeaderWithButtons();

    expect(screen.getByRole("link", { name: "상품" })).toHaveAttribute("href", "/products");
  });

  it("4주차 링크를 기존 접근 이름으로 렌더링한다", () => {
    renderHeaderWithButtons();

    expect(screen.getByRole("link", { name: "4주차" })).toHaveAttribute("href", "/week-04");
  });
});
