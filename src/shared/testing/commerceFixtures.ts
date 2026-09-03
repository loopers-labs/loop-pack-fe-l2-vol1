import type { Product, ProductListResponse } from "@/types/commerce";

export function createMockProduct(product: Partial<Product> = {}): Product {
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

export function createMockProductListResponse(
  response: Partial<ProductListResponse> = {},
): ProductListResponse {
  return {
    products: [],
    categories: [],
    totalCount: 0,
    page: 1,
    pageSize: 12,
    ...response,
  };
}
