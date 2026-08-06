import { describe, expect, it } from "vitest";
import { buildProductListMetadata } from "./productListMetadata";
import {
  commerceOpenGraph,
  commerceOpenGraphFallbackImage,
} from "@/shared/metadata/commerceMetadata";
import type { ProductListResponse } from "../api/productApi";
import type { Product } from "@/entities/product";

const firstProduct: Product = {
  id: "p1",
  brand: "Loopers Select",
  name: "Margaret Sweatshirt - Oatmeal",
  category: "fashion",
  price: 72000,
  originalPrice: null,
  image: "/images/products/p1.jpg",
  freeShipping: true,
  sizes: [],
  rating: 4.8,
  reviewCount: 120,
  createdAt: "2026-08-01T00:00:00.000Z",
};

const response: ProductListResponse = {
  products: [firstProduct],
  categories: [{ id: "fashion", name: "패션" }],
  totalCount: 14,
  page: 2,
  pageSize: 12,
};

describe("buildProductListMetadata", () => {
  it("검색어를 title에 우선 반영하고 페이지 번호, 카테고리, 정렬, 전체 개수, 첫 상품 이미지를 사용한다", () => {
    expect(
      buildProductListMetadata({
        params: { q: "니트", category: "fashion", sort: "price-asc", page: 2 },
        data: response,
      }),
    ).toEqual({
      title: "니트 상품 2페이지",
      description: "패션 카테고리의 낮은 가격순 상품 14개를 확인하세요.",
      openGraph: {
        ...commerceOpenGraph,
        title: "니트 상품 2페이지",
        description: "패션 카테고리의 낮은 가격순 상품 14개를 확인하세요.",
        images: [{ url: firstProduct.image, alt: firstProduct.name }],
      },
    });
  });

  it("0건 결과는 0건 metadata와 Open Graph fallback image를 사용한다", () => {
    expect(
      buildProductListMetadata({
        params: { q: "스탠리", category: "goods", sort: "latest", page: 1 },
        data: { ...response, products: [], totalCount: 0 },
      }),
    ).toEqual({
      title: "스탠리 상품",
      description: "뷰티·잡화 카테고리의 최신순 상품 검색 결과가 0개입니다.",
      openGraph: {
        ...commerceOpenGraph,
        title: "스탠리 상품",
        description: "뷰티·잡화 카테고리의 최신순 상품 검색 결과가 0개입니다.",
        images: [commerceOpenGraphFallbackImage],
      },
    });
  });
});
