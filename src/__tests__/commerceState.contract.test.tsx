// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddToCartButton } from "@/features/add-to-cart";
import { WishlistButton } from "@/features/toggle-wishlist";
// 위젯 내부 컴포넌트라 public API 로 노출하지 않으나, 이 테스트는 헤더 개수 파생을 직접 보려 내부를 집는다.
import { CommerceHeaderCounts } from "@/widgets/commerce/ui/CommerceHeaderCounts";
import { useCartStore } from "@/entities/cart";
import { useWishlistStore } from "@/entities/wishlist";

// ProductCardActions 를 대체 — 담기·위시 버튼을 함께 렌더하는 테스트용 조합(실제로는 ProductCard 가 조합).
function ProductActions({ productId }: { productId: string }) {
  return (
    <>
      <AddToCartButton productId={productId} />
      <WishlistButton productId={productId} />
    </>
  );
}

const cartStatus = () => screen.getByRole("status", { name: /^장바구니/ });
const wishlistStatus = () =>
  screen.getByRole("status", { name: /^위시리스트/ });

// 싱글톤 store 를 매 테스트 초기화한다. 토글이 persist 로 localStorage 에 쓰므로 그것도 비운다.
beforeEach(() => {
  localStorage.clear();
  useCartStore.setState({ ids: new Set(), hasHydrated: true });
  useWishlistStore.setState({ ids: new Set(), hasHydrated: true });
});

afterEach(cleanup);

describe("week8 검증대상 12 — 담기 → 헤더 개수 · 다시 누르면 빠짐", () => {
  test("담으면 헤더 개수가 오르고, 다시 누르면 원래대로 빠진다", async () => {
    render(
      <>
        <CommerceHeaderCounts />
        <ProductActions productId="p1" />
      </>,
    );
    expect(cartStatus()).toHaveAccessibleName("장바구니 0");

    await userEvent.click(screen.getByRole("button", { name: "장바구니" }));
    expect(cartStatus()).toHaveAccessibleName("장바구니 1");
    expect(
      screen.getByRole("button", { name: "장바구니", pressed: true }),
    ).toBeInTheDocument();

    // 경계: 담긴 상품을 다시 누르면 빠지고 개수가 원복된다.
    await userEvent.click(screen.getByRole("button", { name: "장바구니" }));
    expect(cartStatus()).toHaveAccessibleName("장바구니 0");
    expect(
      screen.getByRole("button", { name: "장바구니", pressed: false }),
    ).toBeInTheDocument();
  });

  test("위시리스트도 담기와 독립적으로 개수가 오른다", async () => {
    render(
      <>
        <CommerceHeaderCounts />
        <ProductActions productId="p1" />
      </>,
    );

    await userEvent.click(screen.getByRole("button", { name: "위시리스트" }));

    expect(wishlistStatus()).toHaveAccessibleName("위시리스트 1");
    expect(cartStatus()).toHaveAccessibleName("장바구니 0"); // 담기는 그대로
  });

  test("경계: 복원 전엔 실제 개수를 감추고, 복원 후 store 개수를 파생해 담기에 즉시 반응한다", async () => {
    useCartStore.setState({ hasHydrated: false });
    useWishlistStore.setState({ hasHydrated: false });
    render(
      <>
        <CommerceHeaderCounts />
        <ProductActions productId="p1" />
      </>,
    );

    // 복원 전: 실제 개수("0")를 아직 안 보이고 placeholder 로 가린다.
    expect(cartStatus()).not.toHaveAccessibleName("장바구니 0");

    // 복원 후: store 개수(size)를 그대로 파생해 드러낸다.
    act(() => {
      useCartStore.setState({ hasHydrated: true });
      useWishlistStore.setState({ hasHydrated: true });
    });
    expect(cartStatus()).toHaveAccessibleName("장바구니 0");

    await userEvent.click(screen.getByRole("button", { name: "장바구니" }));
    expect(cartStatus()).toHaveAccessibleName("장바구니 1");
  });

  test("경계: 같은 상품을 여러 곳에 그려도 한 곳에서 담으면 다른 곳 버튼·헤더가 함께 바뀐다", async () => {
    render(
      <>
        <div data-testid="home-surface">
          <ProductActions productId="p1" />
        </div>
        <div data-testid="list-surface">
          <ProductActions productId="p1" />
        </div>
        <CommerceHeaderCounts />
      </>,
    );

    // 두 surface 에 같은 상품의 동일한 "장바구니" 버튼이 있어 within 으로 한쪽만 집는다.
    const homeSurface = within(screen.getByTestId("home-surface"));
    const listSurface = within(screen.getByTestId("list-surface"));

    await userEvent.click(
      homeSurface.getByRole("button", { name: "장바구니" }),
    );

    // 홈에서 담았는데 목록 쪽 같은 상품 버튼도 pressed 로, 헤더 개수도 함께 오른다(같은 store 공유).
    expect(
      listSurface.getByRole("button", { name: "장바구니", pressed: true }),
    ).toBeInTheDocument();
    expect(cartStatus()).toHaveAccessibleName("장바구니 1");
  });
});
