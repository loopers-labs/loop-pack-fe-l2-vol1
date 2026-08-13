import type { Product, ProductListResponse } from "@/entities/product";

// 통합 테스트가 MSW 응답으로 돌려줄 상품·목록 응답을 만든다. 표현에 필요 없는 필드는 기본값으로 채운다.
export function makeProduct(id: string, name = `상품-${id}`): Product {
  return {
    id,
    brand: "브랜드",
    name,
    category: "home",
    price: 1000,
    originalPrice: null,
    image: "/images/products/p1.jpg",
    freeShipping: false,
    sizes: [],
    rating: 0,
    reviewCount: 0,
    createdAt: "2024-01-01T00:00:00.000Z",
  };
}

export function makeResponse(
  products: Product[],
  overrides: Partial<ProductListResponse> = {},
): ProductListResponse {
  return {
    products,
    categories: [],
    totalCount: products.length,
    page: 1,
    pageSize: 12,
    ...overrides,
  };
}
