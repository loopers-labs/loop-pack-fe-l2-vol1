// commerce 도메인 계약. 홈·목록 두 화면이 공유하는 서버 데이터 shape.
// (과제 문서는 src/types/commerce.ts를 예시로 들지만, 이 레포는 feature-first라
//  타입도 피처 안에 둔다. 과제 문서 자체가 "제공 파일 구조는 정답 아님"이라 명시.)

export type CategoryId = "casual" | "fashion" | "goods" | "home" | "digital";

export type Category = {
  id: CategoryId;
  name: string;
};

export type ProductSort = "latest" | "popular" | "price-asc" | "price-desc";

export type MockApiScenario = "empty" | "error";

export type ProductListQuery = {
  q: string;
  category: CategoryId | "all";
  sort: ProductSort;
  page: number;
  pageSize: number;
};

export type Product = {
  id: string;
  brand: string;
  name: string;
  category: CategoryId;
  price: number;
  originalPrice: number | null;
  image: string;
  freeShipping: boolean;
  sizes: Array<{ value: number; stock: number }>;
  rating: number;
  reviewCount: number;
  createdAt: string;
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

export type ApiErrorResponse = {
  message: string;
};
