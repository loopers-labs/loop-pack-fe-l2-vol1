// ─────────────────────────────────────────────────────────
// 타입도 한 파일에 (실무에서 흔히 보는 모습)
// ─────────────────────────────────────────────────────────

// 카테고리는 별도의 유니온 타입으로 지정
export type Category = 'all' | 'electronics' | 'fashion' | 'home' | 'beauty';

export type Product = {
  id: number;
  name: string;
  category: Category;
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

export type SortBy = 'latest' | 'popular' | 'price-asc' | 'price-desc';

// 클라이언트에서 params를 생성하기 위해 필요한 raw 데이터 타입
export type ProductParams = {
  category: Category;
  minPrice: number | '';
  maxPrice: number | '';
  sortBy: SortBy;
  searchQuery: string;
  page: number;
  itemsPerPage: number;
  inStockOnly: boolean;
};

export type ViewMode = 'grid' | 'list';
