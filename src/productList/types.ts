// productList 도메인에서 공유하는 타입 정의

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

export type Category = 'all' | Product['category'];

export type SortBy = 'latest' | 'popular' | 'price-asc' | 'price-desc';

export const PAGE_SIZE = 12;
