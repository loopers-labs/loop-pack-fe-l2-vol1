// @vitest-environment jsdom
// 카트 표시 위젯 테스트 — 담긴 상품을 이름·가격으로 그리고, 비었으면 안내를 보여준다.
// 카탈로그(/api/products)는 기본 핸들러가 빈 목록이라, 이름이 필요한 테스트는 server.use 로 덮는다.

import { afterEach, describe, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { QueryClientProvider } from "@tanstack/react-query";
import { CartLineList } from "./CartLineList";
import { useCartStore } from "@/entities/cart";
import { makeQueryClient } from "@/shared/api";
import { server } from "@/__tests__/msw/server";
import { PRODUCTS_ENDPOINT } from "@/__tests__/msw/handlers";

function seedCart(ids: string[]) {
  useCartStore.setState({ ids: new Set(ids), hasHydrated: true });
}

function renderList() {
  render(
    <QueryClientProvider client={makeQueryClient()}>
      <CartLineList />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  useCartStore.setState({ ids: new Set(), hasHydrated: false });
});

describe("CartLineList", () => {
  test("담긴 상품을 이름과 가격으로 보여준다", async () => {
    server.use(
      http.get(PRODUCTS_ENDPOINT, () =>
        HttpResponse.json({
          products: [{ id: "p1", name: "티셔츠", price: 19000 }],
          categories: [],
          totalCount: 1,
          page: 1,
          pageSize: 100,
        }),
      ),
    );
    seedCart(["p1"]);
    renderList();

    expect(await screen.findByText("티셔츠")).toBeInTheDocument();
    expect(await screen.findByText("19,000원")).toBeInTheDocument();
  });

  test("비어 있으면 안내를 보여준다", () => {
    seedCart([]);
    renderList();

    expect(screen.getByText("장바구니가 비어 있습니다.")).toBeInTheDocument();
  });
});
