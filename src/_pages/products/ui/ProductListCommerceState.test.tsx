import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { createElement } from "react";
import type { ImgHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommerceHeader } from "@/widgets/header";
import { ProductListPageClient } from "./ProductListPage";
import { useCartStore } from "@/entities/cart";
import { useWishlistStore } from "@/entities/wishlist";
import { server } from "@/shared/config/vitest/mswServer";
import {
  createMockProduct,
  createMockProductListResponse,
} from "@/shared/testing/commerceFixtures";
import { renderWithAppProviders } from "@/shared/testing/renderWithAppProviders";

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => createElement("img", props),
}));

function renderProductListWithHeader() {
  renderWithAppProviders(
    <>
      <CommerceHeader />
      <ProductListPageClient />
    </>,
    {
      route: "/products",
      withNuqs: true,
    },
  );
}

describe("ProductListCommerceState", () => {
  beforeEach(() => {
    localStorage.clear();
    useCartStore.setState({
      cartProductQuantityMap: {},
      hasHydrated: true,
    });
    useWishlistStore.setState({
      wishlistProductIdMap: {},
      hasHydrated: true,
    });
    server.use(
      http.get("/api/auth/me", () =>
        HttpResponse.json({ message: "로그인이 필요합니다." }, { status: 401 }),
      ),
      http.get("/api/products", () =>
        HttpResponse.json(
          createMockProductListResponse({
            products: [
              createMockProduct({
                id: "p1",
                name: "첫 번째 상품",
              }),
            ],
            totalCount: 1,
          }),
        ),
      ),
    );
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("상품 카드 action으로 위시리스트는 토글하고 장바구니는 수량을 늘린다", async () => {
    renderProductListWithHeader();

    expect(await screen.findByText("첫 번째 상품")).toBeInTheDocument();
    expect(screen.getByLabelText("위시리스트 0")).toBeInTheDocument();
    expect(screen.getByLabelText("장바구니 0")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "1번 상품 위시리스트" }));
    await userEvent.click(screen.getByRole("button", { name: "1번 상품 장바구니" }));

    expect(screen.getByLabelText("위시리스트 1")).toBeInTheDocument();
    expect(screen.getByLabelText("장바구니 1")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "1번 상품 위시리스트" }));
    await userEvent.click(screen.getByRole("button", { name: "1번 상품 장바구니" }));

    expect(screen.getByLabelText("위시리스트 0")).toBeInTheDocument();
    expect(screen.getByLabelText("장바구니 2")).toBeInTheDocument();
  });
});
