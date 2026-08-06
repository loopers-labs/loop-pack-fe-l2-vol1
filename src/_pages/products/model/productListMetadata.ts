import type { Metadata } from "next";
import {
  commerceOpenGraph,
  commerceOpenGraphFallbackImage,
} from "@/shared/metadata/commerceMetadata";
import type { ProductListResponse } from "../api/productApi";
import type { ProductCategoryFilter, ProductSort } from "./types";

type ProductListMetadataParams = {
  q: string;
  category: ProductCategoryFilter;
  sort: ProductSort;
  page: number;
};

type BuildProductListMetadataOptions = {
  params: ProductListMetadataParams;
  data: ProductListResponse;
};

const categoryNames = {
  all: "전체",
  casual: "캐주얼",
  fashion: "패션",
  goods: "뷰티·잡화",
  home: "홈",
  digital: "디지털",
} satisfies Record<ProductCategoryFilter, string>;

const sortLabels = {
  latest: "최신순",
  popular: "인기순",
  "price-asc": "낮은 가격순",
  "price-desc": "높은 가격순",
} satisfies Record<ProductSort, string>;

export function buildProductListMetadata({
  params,
  data,
}: BuildProductListMetadataOptions): Metadata {
  const title = buildProductListTitle(params);
  const description = buildProductListDescription(params, data.totalCount);
  const firstProduct = data.products[0];
  const images =
    firstProduct === undefined
      ? [commerceOpenGraphFallbackImage]
      : [{ url: firstProduct.image, alt: firstProduct.name }];

  return {
    title,
    description,
    openGraph: {
      ...commerceOpenGraph,
      title,
      description,
      images,
    },
  };
}

function buildProductListTitle({ q, page }: ProductListMetadataParams) {
  const title = q.trim() ? `${q.trim()} 상품` : "상품 목록";

  if (page <= 1) {
    return title;
  }

  return `${title} ${page}페이지`;
}

function buildProductListDescription(
  { category, sort }: ProductListMetadataParams,
  totalCount: number,
) {
  const categoryName = categoryNames[category];
  const sortLabel = sortLabels[sort];

  if (totalCount === 0) {
    return `${categoryName} 카테고리의 ${sortLabel} 상품 검색 결과가 0개입니다.`;
  }

  return `${categoryName} 카테고리의 ${sortLabel} 상품 ${totalCount}개를 확인하세요.`;
}
