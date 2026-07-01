// ─────────────────────────────────────────────────────────
// 타입도 한 파일에 (실무에서 흔히 보는 모습)
// ─────────────────────────────────────────────────────────

export type Product = {
  id: number;
  name: string;
  category: 'electronics' | 'fashion' | 'home' | 'beauty';
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
