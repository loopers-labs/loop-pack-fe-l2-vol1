import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { createElement, Suspense } from "react";
import type { ImgHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HomeErrorBoundary } from "./HomeErrorBoundary";
import { HomeLoading } from "./HomeLoading";
import { HomePageClient } from "./HomePageClient";
import { useCartStore } from "@/entities/cart";
import { useWishlistStore } from "@/entities/wishlist";
import type { Product } from "@/entities/product";
import { server } from "@/shared/config/vitest/mswServer";
import { renderWithAppProviders } from "@/shared/testing/renderWithAppProviders";

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => createElement("img", props),
}));

const queryRetryTimeout = { timeout: 3000 };

function renderHomePageClient() {
  renderWithAppProviders(
    <HomeErrorBoundary>
      <Suspense fallback={<HomeLoading />}>
        <HomePageClient />
      </Suspense>
    </HomeErrorBoundary>,
  );
}

describe("HomePageClient", () => {
  beforeEach(() => {
    useCartStore.setState({
      cartProductIdMap: {},
    });
    useWishlistStore.setState({
      wishlistProductIdMap: {},
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("홈 데이터를 불러오는 동안 로딩 상태를 보여준다", () => {
    server.use(http.get("/api/home", () => new Promise(() => undefined)));

    renderHomePageClient();

    expect(screen.getByLabelText("홈 데이터를 불러오는 중입니다.")).toBeInTheDocument();
  });

  it("홈 데이터 요청이 실패하면 에러 상태와 다시 시도 버튼을 보여준다", async () => {
    let requestCount = 0;
    server.use(
      http.get("/api/home", () => {
        requestCount += 1;

        return HttpResponse.json(
          { message: "홈 데이터를 불러오지 못했습니다." },
          {
            status: 500,
          },
        );
      }),
    );

    renderHomePageClient();

    expect(
      await screen.findByText("홈 데이터를 불러오지 못했습니다.", {}, queryRetryTimeout),
    ).toBeInTheDocument();
    expect(requestCount).toBe(2);
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();
  });

  it("다시 시도 버튼을 누르면 홈 데이터를 다시 요청한다", async () => {
    let requestCount = 0;
    server.use(
      http.get("/api/home", () => {
        requestCount += 1;

        if (requestCount <= 2) {
          return HttpResponse.json(
            { message: "홈 데이터를 불러오지 못했습니다." },
            {
              status: 500,
            },
          );
        }

        return HttpResponse.json(
          createHomeResponse({
            popularProducts: [
              createProduct({
                id: "p1",
                name: "인기 상품",
              }),
            ],
            newProducts: [
              createProduct({
                id: "p2",
                name: "신상품",
              }),
            ],
          }),
        );
      }),
    );

    renderHomePageClient();

    expect(
      await screen.findByText("홈 데이터를 불러오지 못했습니다.", {}, queryRetryTimeout),
    ).toBeInTheDocument();
    expect(requestCount).toBe(2);

    await userEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(
      await screen.findByRole("heading", { name: "매일 새롭게 발견하는 취향", level: 1 }),
    ).toBeInTheDocument();
    expect(requestCount).toBe(3);
  });

  it("상품 배열이 비어 있으면 상품 섹션의 빈 상태를 보여준다", async () => {
    server.use(http.get("/api/home", () => HttpResponse.json(createHomeResponse())));

    renderHomePageClient();

    expect(await screen.findByRole("heading", { name: "인기 상품" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "신상품" })).toBeInTheDocument();
    expect(screen.getAllByText("표시할 상품이 없습니다.")).toHaveLength(2);
  });

  it("홈 데이터가 있으면 배너, 카테고리, 상품 섹션을 렌더링한다", async () => {
    server.use(
      http.get("/api/home", () =>
        HttpResponse.json(
          createHomeResponse({
            popularProducts: [
              createProduct({
                id: "p1",
                name: "인기 상품",
              }),
            ],
            newProducts: [
              createProduct({
                id: "p2",
                name: "신상품",
              }),
            ],
          }),
        ),
      ),
    );

    renderHomePageClient();

    expect(
      await screen.findByRole("heading", { name: "매일 새롭게 발견하는 취향", level: 1 }),
    ).toBeInTheDocument();
    expect(document.querySelector('img[src="/images/week-07/hero-1600.webp"]')).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "뷰티·잡화" })).toHaveAttribute(
      "href",
      "/products?category=goods",
    );
    expect(screen.getByRole("heading", { name: "인기 상품", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "신상품", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "인기 상품", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "신상품", level: 3 })).toBeInTheDocument();
  });
});

function createHomeResponse({
  popularProducts = [],
  newProducts = [],
}: {
  popularProducts?: Product[];
  newProducts?: Product[];
} = {}) {
  return {
    banner: {
      title: "매일 새롭게 발견하는 취향",
      description: "지금 가장 사랑받는 상품을 만나보세요.",
      image: "/images/products/p6.jpg",
    },
    categories: [{ id: "goods", name: "뷰티·잡화" }],
    popularProducts,
    newProducts,
  };
}

function createProduct(product: Partial<Product> = {}): Product {
  return {
    id: "product-id",
    brand: "Loopers Select",
    name: "상품명",
    category: "goods",
    price: 10000,
    originalPrice: null,
    image: "/images/products/p1.jpg",
    freeShipping: false,
    sizes: [],
    rating: 4.5,
    reviewCount: 10,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...product,
  };
}
