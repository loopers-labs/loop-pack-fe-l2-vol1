// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCartStore } from "@/entities/cart/model/cartStore";
import { useWishlistStore } from "@/entities/wishlist/model/wishlistStore";
import { renderWithProviders } from "@/test/renderWithProviders";
import { looperUser, withSession } from "@/test/session";
import { Header } from "@/widgets/header/ui/Header";

// 로그인 상태 테스트의 LogoutButton이 useRouter를 쓴다. next/navigation은 setup.ts에서 전역 목킹한다.
beforeEach(() => {
  localStorage.clear();
  useCartStore.setState({ cartIds: [] });
  useWishlistStore.setState({ wishlistIds: [] });
});

// hasHydrated spy가 다음 테스트로 새지 않게 되돌린다.
afterEach(() => {
  vi.restoreAllMocks();
});

// 헤더 개수는 별도 저장이 아니라 store id 목록에서 파생된다.
describe("헤더 하이드레이션 게이트", () => {
  it("복원 전에는 개수 대신 로딩(Skeleton)을 보인다", () => {
    // hasHydrated는 모듈 싱글턴이라 한 번 true가 되면 되돌릴 수 없다.
    // 다른 테스트가 먼저 복원하면(무작위 순서 실행) "복원 전" 전제가 깨지므로,
    // false로 고정해 순서와 무관하게 이 분기를 검증한다.
    vi.spyOn(useCartStore.persist, "hasHydrated").mockReturnValue(false);
    vi.spyOn(useWishlistStore.persist, "hasHydrated").mockReturnValue(false);

    render(<Header />);

    // skipHydration이라 복원 전엔 잘못된 0 대신 Skeleton — 개수 span이 없다.
    expect(screen.queryByText(/장바구니 \d/)).not.toBeInTheDocument();
    expect(screen.queryByText(/위시리스트 \d/)).not.toBeInTheDocument();
  });
});

// 복원이 끝난 상태를 전제한다. 복원 후 개수가 나타나는 것도 여기서 함께 확인된다.
describe("헤더 개수 파생", () => {
  beforeEach(async () => {
    await useCartStore.persist.rehydrate();
    await useWishlistStore.persist.rehydrate();
    useCartStore.setState({ cartIds: [] });
    useWishlistStore.setState({ wishlistIds: [] });
  });

  it("담고 찜하면 헤더 개수가 따라 바뀐다", () => {
    render(<Header />);

    expect(screen.getByText("장바구니 0")).toBeInTheDocument();
    expect(screen.getByText("위시리스트 0")).toBeInTheDocument();

    act(() => {
      useCartStore.getState().addToCart("p1");
      useCartStore.getState().addToCart("p2");
      useWishlistStore.getState().toggleWishlist("p3");
    });

    expect(screen.getByText("장바구니 2")).toBeInTheDocument();
    expect(screen.getByText("위시리스트 1")).toBeInTheDocument();
  });

  it("담았다 다시 빼면 헤더 개수가 줄어든다", () => {
    render(<Header />);

    act(() => {
      useCartStore.getState().addToCart("p1");
      useCartStore.getState().addToCart("p2");
    });
    expect(screen.getByText("장바구니 2")).toBeInTheDocument();

    act(() => {
      useCartStore.getState().removeFromCart("p1");
    });
    expect(screen.getByText("장바구니 1")).toBeInTheDocument();
  });
});

describe("헤더 로그인 상태", () => {
  it("비로그인이면 로그인 링크를 보이고 로그아웃은 없다", () => {
    // SessionProvider 없이 렌더하면 컨텍스트 기본값(null) → 비로그인.
    render(<Header />);

    expect(screen.getByRole("link", { name: "로그인" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "로그아웃" })).not.toBeInTheDocument();
  });

  it("로그인 상태면 이름과 로그아웃을 보이고 로그인 링크는 없다", () => {
    renderWithProviders(withSession(looperUser(1), <Header />));

    expect(screen.getByText("루퍼1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "로그아웃" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "로그인" })).not.toBeInTheDocument();
  });
});
