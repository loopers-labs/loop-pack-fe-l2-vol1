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

/** useProductFilters reducer 가 관리하는 상태 — URL 로 복원되는 필터 전체(viewMode 제외). */
export type FilterState = Omit<ProductFilters, "viewMode">;

/** useProductFilters reducer 가 처리하는 액션. */
export type FilterAction =
  | { type: "setCategory"; value: CategoryFilter }
  | { type: "setMinPrice"; value: number | "" }
  | { type: "setMaxPrice"; value: number | "" }
  | { type: "setSortBy"; value: SortBy }
  | { type: "setSearchQuery"; value: string }
  | { type: "setInStockOnly"; value: boolean }
  | { type: "setPage"; value: number }
  | { type: "reset" };

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

/** 검색어 하이라이트를 위해 텍스트를 쪼갠 한 조각(일치 여부 포함). */
export type HighlightPart = {
  text: string;
  isMatch: boolean;
};
