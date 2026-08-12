import { cache } from "react";
import { categories, products, waitForMockApi } from "@/app/api/_data/commerce";
import { MockApiError } from "../_contract";
import type {
  CategoryId,
  MockApiScenario,
  ProductListResponse,
  ProductSort,
} from "@/types/commerce";

export type ProductListRequest = {
  q: string;
  category: CategoryId | "all" | null;
  sort: ProductSort | null;
  page: number;
  pageSize: number;
  scenario: MockApiScenario | null;
};

// React cache는 인자 동일성으로 메모하므로 객체 대신 원시값 인자로 받는다
const getCachedProductList = cache(
  async (
    q: string,
    category: ProductListRequest["category"],
    sort: ProductSort | null,
    page: number,
    pageSize: number,
    scenario: MockApiScenario | null,
  ): Promise<ProductListResponse> => {
    await waitForMockApi(scenario === "slow" ? 1_500 : 500);

    if (scenario === "error") {
      throw new MockApiError("상품 목록을 불러오지 못했습니다.", 500);
    }

    const keyword = q.trim().toLocaleLowerCase("ko");
    const filteredProducts = products.filter((product) => {
      const matchesCategory =
        category === null || category === "all" || product.category === category;
      const searchable = `${product.brand} ${product.name}`.toLocaleLowerCase("ko");
      return matchesCategory && searchable.includes(keyword);
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
  },
);

export const getProductListResponse = (request: ProductListRequest) =>
  getCachedProductList(
    request.q,
    request.category,
    request.sort,
    request.page,
    request.pageSize,
    request.scenario,
  );
