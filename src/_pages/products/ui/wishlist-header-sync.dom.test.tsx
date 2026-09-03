import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { HeaderActions } from "@/widgets/header";
import { renderWithProviders } from "@/test/render-with-providers";
import { ProductListContent } from "./product-list-content";

it("상품을 찜하면 헤더 위시리스트가 1이 되고 다시 누르면 0으로 돌아간다", async () => {
  const user = userEvent.setup();
  renderWithProviders(
    <>
      <HeaderActions />
      <ProductListContent />
    </>,
  );
  await screen.findByText("총 25개");
  expect(screen.getByText("위시리스트 0")).toBeInTheDocument();

  const wishlistButton = screen.getByRole("button", { name: "casual-1 위시리스트" });
  await user.click(wishlistButton);
  expect(screen.getByText("위시리스트 1")).toBeInTheDocument();
  expect(wishlistButton).toHaveAttribute("aria-pressed", "true");
  expect(wishlistButton).toHaveTextContent(/^찜됨$/);

  await user.click(wishlistButton);
  expect(screen.getByText("위시리스트 0")).toBeInTheDocument();
  expect(wishlistButton).toHaveAttribute("aria-pressed", "false");
  expect(wishlistButton).toHaveTextContent(/^찜$/);
});

it("서로 다른 상품 두 개를 찜하면 위시리스트만 2가 되고 장바구니는 0을 유지한다", async () => {
  const user = userEvent.setup();
  renderWithProviders(
    <>
      <HeaderActions />
      <ProductListContent />
    </>,
  );
  await screen.findByText("총 25개");

  await user.click(screen.getByRole("button", { name: "casual-1 위시리스트" }));
  await user.click(screen.getByRole("button", { name: "casual-2 위시리스트" }));

  expect(screen.getByText("위시리스트 2")).toBeInTheDocument();
  expect(screen.getByText("장바구니 0")).toBeInTheDocument();
});
