import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CommerceHeader } from "./CommerceHeader";
import { useCartStore } from "@/entities/cart";
import { useWishlistStore } from "@/entities/wishlist";
import { server } from "@/shared/config/vitest/mswServer";
import { renderWithAppProviders } from "@/shared/testing/renderWithAppProviders";

const user = {
  id: "u1",
  name: "루퍼1",
  email: "looper1@loopers.dev",
};

function renderCommerceHeader() {
  renderWithAppProviders(<CommerceHeader />);
}

describe("CommerceHeader", () => {
  beforeEach(() => {
    useCartStore.setState({
      cartProductQuantityMap: {},
      hasHydrated: true,
    });
    useWishlistStore.setState({
      wishlistProductIdMap: {},
      hasHydrated: true,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("비로그인 상태이면 로그인 링크를 보여준다", async () => {
    server.use(
      http.get("/api/auth/me", () =>
        HttpResponse.json({ message: "로그인이 필요합니다." }, { status: 401 }),
      ),
    );

    renderCommerceHeader();

    expect(await screen.findByRole("link", { name: "로그인" })).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("button", { name: "로그아웃" })).not.toBeInTheDocument();
  });

  it("로그인 상태에서 로그아웃하면 세션만 비우고 장바구니와 위시리스트는 유지한다", async () => {
    let didRequestLogout = false;
    useCartStore.setState({
      cartProductQuantityMap: { p1: 1 },
      hasHydrated: true,
    });
    useWishlistStore.setState({
      wishlistProductIdMap: { p2: true },
      hasHydrated: true,
    });
    server.use(
      http.get("/api/auth/me", () => HttpResponse.json({ user })),
      http.post("/api/auth/logout", () => {
        didRequestLogout = true;

        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderCommerceHeader();

    expect(await screen.findByText("루퍼1님")).toBeInTheDocument();
    expect(screen.getByLabelText("장바구니 1")).toBeInTheDocument();
    expect(screen.getByLabelText("위시리스트 1")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "로그아웃" }));

    await waitFor(() => {
      expect(didRequestLogout).toBe(true);
    });
    expect(await screen.findByRole("link", { name: "로그인" })).toBeInTheDocument();
    expect(screen.getByLabelText("장바구니 1")).toBeInTheDocument();
    expect(screen.getByLabelText("위시리스트 1")).toBeInTheDocument();
  });

  it("장바구니 개수는 장바구니 페이지로 이동하는 링크에 표시한다", async () => {
    useCartStore.setState({
      cartProductQuantityMap: { p1: 2 },
      hasHydrated: true,
    });
    server.use(
      http.get("/api/auth/me", () =>
        HttpResponse.json({ message: "로그인이 필요합니다." }, { status: 401 }),
      ),
    );

    renderCommerceHeader();

    expect(await screen.findByLabelText("장바구니 2")).toHaveAttribute("href", "/cart");
  });
});
