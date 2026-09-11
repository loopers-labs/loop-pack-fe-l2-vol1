import { cleanup, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useWishlistStore } from "@/entities/wishlist";
import { renderWithAppProviders } from "@/shared/testing/renderWithAppProviders";
import { WishlistPage } from "./WishlistPage";

describe("WishlistPage", () => {
  beforeEach(() => {
    useWishlistStore.setState({
      wishlistProductIdMap: {},
      hasHydrated: true,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("찜한 상품이 없으면 빈 상태와 상품 이동 링크를 보여준다", () => {
    renderWithAppProviders(<WishlistPage />);

    expect(screen.getByRole("heading", { name: "위시리스트", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("찜한 상품이 없습니다.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "상품 둘러보기" })).toHaveAttribute(
      "href",
      "/products",
    );
  });

  it("찜한 상품이 있으면 상품 id 목록과 총 개수를 보여준다", () => {
    useWishlistStore.setState({
      wishlistProductIdMap: { p1: true, p3: true },
      hasHydrated: true,
    });

    renderWithAppProviders(<WishlistPage />);

    expect(screen.getByText("총 2개")).toBeInTheDocument();
    expect(screen.getByRole("listitem", { name: "p1 찜한 상품" })).toBeInTheDocument();
    expect(screen.getByRole("listitem", { name: "p3 찜한 상품" })).toBeInTheDocument();
  });
});
