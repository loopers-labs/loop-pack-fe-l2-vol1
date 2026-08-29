import { cleanup, render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { createElement } from "react";
import type { ImgHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CART_STORE_STORAGE_KEY, useCartStore } from "@/entities/cart";
import type { ProductCardItem } from "@/entities/product";
import { useWishlistStore, WISHLIST_STORE_STORAGE_KEY } from "@/entities/wishlist";
import { CommerceHeader } from "@/widgets/header";
import { CommerceProductCard } from "@/widgets/product-card";
import { CommerceStoreHydrator } from "@/_app/providers/CommerceStoreHydrator";
import { server } from "@/shared/config/vitest/mswServer";
import { renderWithAppProviders } from "@/shared/testing/renderWithAppProviders";

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => createElement("img", props),
}));

const product: ProductCardItem = {
  id: "p1",
  image: "/images/products/p1.jpg",
  imageAlt: "테스트 상품",
  brand: "Loopers Select",
  name: "테스트 상품",
  priceText: "10,000원",
};

describe("commerce hydration", () => {
  beforeEach(() => {
    localStorage.clear();
    server.use(
      http.get("/api/auth/me", () =>
        HttpResponse.json({ message: "로그인이 필요합니다." }, { status: 401 }),
      ),
    );
    useCartStore.setState({
      cartProductQuantityMap: {},
      hasHydrated: false,
    });
    useWishlistStore.setState({
      wishlistProductIdMap: {},
      hasHydrated: false,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("store 복원 전에는 헤더 개수를 확정값처럼 렌더링하지 않는다", () => {
    useCartStore.setState({
      cartProductQuantityMap: { p1: 1 },
      hasHydrated: false,
    });
    useWishlistStore.setState({
      wishlistProductIdMap: { p2: true },
      hasHydrated: false,
    });

    renderWithAppProviders(<CommerceHeader />);

    expect(screen.getByLabelText("위시리스트 -")).toBeInTheDocument();
    expect(screen.getByLabelText("장바구니 -")).toBeInTheDocument();
  });

  it("store 복원 전후에 헤더 메뉴 폭이 바뀌지 않도록 개수 영역 폭을 예약한다", () => {
    useCartStore.setState({
      cartProductQuantityMap: { p1: 1 },
      hasHydrated: false,
    });
    useWishlistStore.setState({
      wishlistProductIdMap: { p2: true },
      hasHydrated: false,
    });

    renderWithAppProviders(<CommerceHeader />);

    expect(screen.getByLabelText("위시리스트 -")).toHaveClass("min-w-[7.5rem]");
    expect(screen.getByLabelText("장바구니 -")).toHaveClass("min-w-[7rem]");
  });

  it("store 복원 후에는 헤더 개수를 저장값 기준으로 렌더링한다", () => {
    useCartStore.setState({
      cartProductQuantityMap: { p1: 1 },
      hasHydrated: true,
    });
    useWishlistStore.setState({
      wishlistProductIdMap: { p2: true },
      hasHydrated: true,
    });

    renderWithAppProviders(<CommerceHeader />);

    expect(screen.getByLabelText("위시리스트 1")).toBeInTheDocument();
    expect(screen.getByLabelText("장바구니 1")).toBeInTheDocument();
  });

  it("store 복원 전에는 위시리스트 버튼 상태를 서버 기준 기본값으로 렌더링한다", () => {
    useCartStore.setState({
      cartProductQuantityMap: { p1: 1 },
      hasHydrated: false,
    });
    useWishlistStore.setState({
      wishlistProductIdMap: { p1: true },
      hasHydrated: false,
    });

    render(
      <CommerceProductCard
        product={product}
        wishlistLabel="테스트 상품 위시리스트"
        cartLabel="테스트 상품 장바구니"
      />,
    );

    expect(screen.getByRole("button", { name: "테스트 상품 위시리스트" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "테스트 상품 장바구니" })).not.toHaveAttribute(
      "aria-pressed",
    );
  });

  it("store 복원 전에는 상품 액션 버튼을 비활성화한다", () => {
    useCartStore.setState({
      cartProductQuantityMap: { p1: 1 },
      hasHydrated: false,
    });
    useWishlistStore.setState({
      wishlistProductIdMap: { p1: true },
      hasHydrated: false,
    });

    render(
      <CommerceProductCard
        product={product}
        wishlistLabel="테스트 상품 위시리스트"
        cartLabel="테스트 상품 장바구니"
      />,
    );

    expect(screen.getByRole("button", { name: "테스트 상품 위시리스트" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "테스트 상품 장바구니" })).toBeDisabled();
  });

  it("store 복원 후에는 위시리스트 버튼 상태만 저장값 기준으로 렌더링한다", () => {
    useCartStore.setState({
      cartProductQuantityMap: { p1: 1 },
      hasHydrated: true,
    });
    useWishlistStore.setState({
      wishlistProductIdMap: { p1: true },
      hasHydrated: true,
    });

    render(
      <CommerceProductCard
        product={product}
        wishlistLabel="테스트 상품 위시리스트"
        cartLabel="테스트 상품 장바구니"
      />,
    );

    expect(screen.getByRole("button", { name: "테스트 상품 위시리스트" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "테스트 상품 장바구니" })).not.toHaveAttribute(
      "aria-pressed",
    );
  });

  it("장바구니 저장값 파싱에 실패해도 복원 완료 상태로 전환한다", async () => {
    localStorage.setItem(CART_STORE_STORAGE_KEY, "not-json");

    await useCartStore.persist.rehydrate();

    expect(useCartStore.getState().hasHydrated).toBe(true);
  });

  it("위시리스트 저장값 파싱에 실패해도 복원 완료 상태로 전환한다", async () => {
    localStorage.setItem(WISHLIST_STORE_STORAGE_KEY, "not-json");

    await useWishlistStore.persist.rehydrate();

    expect(useWishlistStore.getState().hasHydrated).toBe(true);
  });

  it("persist 자동 복원을 건너뛰도록 설정한다", () => {
    expect(useCartStore.persist.getOptions().skipHydration).toBe(true);
    expect(useWishlistStore.persist.getOptions().skipHydration).toBe(true);
  });

  it("hydrator가 마운트되면 장바구니와 위시리스트 store 복원을 명시적으로 실행한다", () => {
    const cartRehydrateSpy = vi.spyOn(useCartStore.persist, "rehydrate").mockResolvedValue();
    const wishlistRehydrateSpy = vi
      .spyOn(useWishlistStore.persist, "rehydrate")
      .mockResolvedValue();

    render(<CommerceStoreHydrator />);

    expect(cartRehydrateSpy).toHaveBeenCalledOnce();
    expect(wishlistRehydrateSpy).toHaveBeenCalledOnce();
  });
});
