// mock 백엔드가 소유하는 계약 (FSD 레이어 밖 — docs/rfc/week06-fsd.md §2.8)
// 응답 봉투는 프론트(_pages/*/api)와 의도적으로 중복 정의한다 — 네트워크 경계 양쪽의 독립성.
// 도메인 모델 타입만 entities에서 type-only로 가져온다.
import type { Category, Product } from "@/entities/product";

export type MockApiScenario = "empty" | "error";

export type ApiErrorResponse = {
  message: string;
};

export type HomeResponse = {
  banner: { title: string; description: string; image: string };
  categories: Category[];
  popularProducts: Product[];
  newProducts: Product[];
};

export type ProductListResponse = {
  products: Product[];
  categories: Category[];
  totalCount: number;
  page: number;
  pageSize: number;
};
