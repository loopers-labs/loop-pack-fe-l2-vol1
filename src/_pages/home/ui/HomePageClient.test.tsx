import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement, Suspense } from "react";
import type { ImgHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HomeErrorBoundary } from "./HomeErrorBoundary";
import { HomeLoading } from "./HomeLoading";
import { HomePageClient } from "./HomePageClient";
import { getHome } from "../api/homeApi";
import { useCommerceStore } from "@/_app/model/commerceStore";
import type { Product } from "@/entities/product";

vi.mock("../api/homeApi", () => ({
  getHome: vi.fn(),
}));

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => createElement("img", props),
}));

const mockedGetHome = vi.mocked(getHome);

function renderHomePageClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <HomeErrorBoundary>
        <Suspense fallback={<HomeLoading />}>
          <HomePageClient />
        </Suspense>
      </HomeErrorBoundary>
    </QueryClientProvider>,
  );
}

describe("HomePageClient", () => {
  beforeEach(() => {
    useCommerceStore.setState({
      cartProductIdMap: {},
      wishlistProductIdMap: {},
    });
    mockedGetHome.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("홈 데이터를 불러오는 동안 로딩 상태를 보여준다", () => {
    mockedGetHome.mockReturnValue(new Promise(() => {}));

    renderHomePageClient();

    expect(screen.getByLabelText("홈 데이터를 불러오는 중입니다.")).toBeInTheDocument();
  });

  it("홈 데이터 요청이 실패하면 에러 상태와 다시 시도 버튼을 보여준다", async () => {
    mockedGetHome.mockRejectedValue(new Error("홈 데이터를 불러오지 못했습니다."));

    renderHomePageClient();

    expect(await screen.findByText("홈 데이터를 불러오지 못했습니다.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();
  });

  it("다시 시도 버튼을 누르면 홈 데이터를 다시 요청한다", async () => {
    mockedGetHome
      .mockRejectedValueOnce(new Error("홈 데이터를 불러오지 못했습니다."))
      .mockResolvedValueOnce({
        banner: {
          title: "매일 새롭게 발견하는 취향",
          description: "지금 가장 사랑받는 상품을 만나보세요.",
          image: "/images/products/p6.jpg",
        },
        categories: [{ id: "goods", name: "뷰티·잡화" }],
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
      });

    renderHomePageClient();

    expect(await screen.findByText("홈 데이터를 불러오지 못했습니다.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(
      await screen.findByRole("heading", { name: "매일 새롭게 발견하는 취향", level: 1 }),
    ).toBeInTheDocument();
    expect(mockedGetHome).toHaveBeenCalledTimes(2);
  });

  it("상품 배열이 비어 있으면 상품 섹션의 빈 상태를 보여준다", async () => {
    mockedGetHome.mockResolvedValue({
      banner: {
        title: "매일 새롭게 발견하는 취향",
        description: "지금 가장 사랑받는 상품을 만나보세요.",
        image: "/images/products/p6.jpg",
      },
      categories: [{ id: "goods", name: "뷰티·잡화" }],
      popularProducts: [],
      newProducts: [],
    });

    renderHomePageClient();

    expect(await screen.findByRole("heading", { name: "인기 상품" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "신상품" })).toBeInTheDocument();
    expect(screen.getAllByText("표시할 상품이 없습니다.")).toHaveLength(2);
  });

  it("홈 데이터가 있으면 배너, 카테고리, 상품 섹션을 렌더링한다", async () => {
    mockedGetHome.mockResolvedValue({
      banner: {
        title: "매일 새롭게 발견하는 취향",
        description: "지금 가장 사랑받는 상품을 만나보세요.",
        image: "/images/products/p6.jpg",
      },
      categories: [{ id: "goods", name: "뷰티·잡화" }],
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
    });

    renderHomePageClient();

    expect(
      await screen.findByRole("heading", { name: "매일 새롭게 발견하는 취향", level: 1 }),
    ).toBeInTheDocument();
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
