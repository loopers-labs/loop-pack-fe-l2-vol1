import { categories, homeBanner, products, waitForMockApi } from "./commerce";
import type {
  CategoryId,
  HomeResponse,
  MockApiScenario,
  ProductListResponse,
  ProductSort,
} from "@/types/commerce";

if (typeof window !== "undefined") {
  throw new Error("commerce.server.ts는 서버에서만 사용할 수 있습니다.");
}

export class MockApiScenarioError extends Error {}

export type ProductListDataInput = {
  q: string;
  category: CategoryId | "all" | null;
  sort: ProductSort | null;
  page: number;
  pageSize: number;
  scenario?: MockApiScenario | null;
};

export const isProductCategory = (value: string): value is CategoryId =>
  categories.some((category) => category.id === value);

export async function getHomeData(
  scenario: MockApiScenario | null = null,
): Promise<HomeResponse> {
  await waitForMockApi(scenario);

  if (scenario === "error") {
    throw new MockApiScenarioError();
  }

  const popularProducts = [...products]
    .sort((a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating)
    .slice(0, 6);
  const newProducts = [...products]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 6);

  return {
    banner: homeBanner,
    categories,
    popularProducts: scenario === "empty" ? [] : popularProducts,
    newProducts: scenario === "empty" ? [] : newProducts,
  };
}

export async function getProductListData({
  q,
  category,
  sort,
  page,
  pageSize,
  scenario = null,
}: ProductListDataInput): Promise<ProductListResponse> {
  await waitForMockApi(scenario);

  if (scenario === "error") {
    throw new MockApiScenarioError();
  }

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      category === null || category === "all" || product.category === category;
    const searchable = `${product.brand} ${product.name}`.toLocaleLowerCase("ko");
    return matchesCategory && searchable.includes(q);
  });
  const sortedProducts = [...filteredProducts];

  if (sort !== null) {
    sortedProducts.sort((a, b) => {
      switch (sort) {
        case "popular":
          return b.reviewCount - a.reviewCount || b.rating - a.rating;
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "latest":
          return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      }
    });
  }

  const start = (page - 1) * pageSize;
  const pagedProducts = sortedProducts.slice(start, start + pageSize);

  return {
    products: scenario === "empty" ? [] : pagedProducts,
    categories,
    totalCount: scenario === "empty" ? 0 : filteredProducts.length,
    page,
    pageSize,
  };
}
