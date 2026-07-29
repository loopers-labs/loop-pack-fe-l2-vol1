import { cleanup, render, screen } from "@testing-library/react";
import { createElement } from "react";
import type { ImgHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductCardItem } from "@/entities/product";
import { CommerceHeader } from "@/widgets/header";
import { CommerceProductCard } from "@/widgets/product-card";
import { COMMERCE_STORE_STORAGE_KEY } from "@/_app/model/commercePersistence";
import { useCommerceStore } from "@/_app/model/commerceStore";
import { CommerceStoreHydrator } from "@/_app/providers/CommerceStoreHydrator";

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
    useCommerceStore.setState({
      cartProductIdMap: {},
      wishlistProductIdMap: {},
      hasHydrated: false,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("store 복원 전에는 헤더 개수를 확정값처럼 렌더링하지 않는다", () => {
    useCommerceStore.setState({
      cartProductIdMap: { p1: true },
      wishlistProductIdMap: { p2: true },
      hasHydrated: false,
    });

    render(<CommerceHeader />);

    expect(screen.getByLabelText("위시리스트 -")).toBeInTheDocument();
    expect(screen.getByLabelText("장바구니 -")).toBeInTheDocument();
  });

  it("store 복원 전후에 헤더 메뉴 폭이 바뀌지 않도록 개수 영역 폭을 예약한다", () => {
    useCommerceStore.setState({
      cartProductIdMap: { p1: true },
      wishlistProductIdMap: { p2: true },
      hasHydrated: false,
    });

    render(<CommerceHeader />);

    expect(screen.getByLabelText("위시리스트 -")).toHaveClass("min-w-[7.5rem]");
    expect(screen.getByLabelText("장바구니 -")).toHaveClass("min-w-[7rem]");
  });

  it("store 복원 후에는 헤더 개수를 저장값 기준으로 렌더링한다", () => {
    useCommerceStore.setState({
      cartProductIdMap: { p1: true },
      wishlistProductIdMap: { p2: true },
      hasHydrated: true,
    });

    render(<CommerceHeader />);

    expect(screen.getByLabelText("위시리스트 1")).toBeInTheDocument();
    expect(screen.getByLabelText("장바구니 1")).toBeInTheDocument();
  });

  it("store 복원 전에는 상품 버튼 상태를 서버 기준 기본값으로 렌더링한다", () => {
    useCommerceStore.setState({
      cartProductIdMap: { p1: true },
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
    expect(screen.getByRole("button", { name: "테스트 상품 장바구니" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("store 복원 전에는 상품 액션 버튼을 비활성화한다", () => {
    useCommerceStore.setState({
      cartProductIdMap: { p1: true },
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

  it("store 복원 후에는 상품 버튼 상태를 저장값 기준으로 렌더링한다", () => {
    useCommerceStore.setState({
      cartProductIdMap: { p1: true },
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
    expect(screen.getByRole("button", { name: "테스트 상품 장바구니" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("저장값 파싱에 실패해도 복원 완료 상태로 전환한다", async () => {
    localStorage.setItem(COMMERCE_STORE_STORAGE_KEY, "not-json");

    await useCommerceStore.persist.rehydrate();

    expect(useCommerceStore.getState().hasHydrated).toBe(true);
  });

  it("persist 자동 복원을 건너뛰도록 설정한다", () => {
    expect(useCommerceStore.persist.getOptions().skipHydration).toBe(true);
  });

  it("hydrator가 마운트되면 store 복원을 명시적으로 실행한다", () => {
    const rehydrateSpy = vi.spyOn(useCommerceStore.persist, "rehydrate").mockResolvedValue();

    render(<CommerceStoreHydrator />);

    expect(rehydrateSpy).toHaveBeenCalledOnce();
  });
});
