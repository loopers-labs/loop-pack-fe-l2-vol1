export type Product = {
  id: number;
  name: string;
  category: "electronics" | "fashion" | "home" | "beauty";
  price: number;
  originalPrice?: number;
  stock: number;
  imageUrl: string;
  createdAt: string;
  rating: number;
  reviewCount: number;
};

export type ProductListResponse = {
  products: Product[];
  totalCount: number;
};

export type SortBy = "latest" | "popular" | "price-asc" | "price-desc";

export type CategoryFilter = "all" | Product["category"];

export type ViewMode = "grid" | "list";

/** 사용자가 조작하는 전체 필터/검색/페이지/옵션 클라이언트 상태. */
export type ProductFilters = {
  category: CategoryFilter;
  minPrice: number | "";
  maxPrice: number | "";
  sortBy: SortBy;
  searchQuery: string;
  page: number;
  inStockOnly: boolean;
  viewMode: ViewMode;
};

/** 서버로 보내는 조회 조건 — inStockOnly·viewMode 같은 클라이언트 전용 값은 제외. */
export type ProductQuery = {
  category: CategoryFilter;
  minPrice: number | "";
  maxPrice: number | "";
  sortBy: SortBy;
  searchQuery: string;
  page: number;
};

/** 상품 카드에 표시할 배지/상태를 한 번에 계산한 뷰모델. */
export type ProductBadges = {
  discountRate: number;
  isNew: boolean;
  isHotDeal: boolean;
  isBest: boolean;
  isSoldOut: boolean;
  isAlmostSoldOut: boolean;
  isFreeShipping: boolean;
};
