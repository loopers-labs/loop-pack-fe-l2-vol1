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

export type ProductListParams = {
  category: string;
  sortBy: string;
  searchQuery: string;
  page: number;
  minPrice: number | '';
  maxPrice: number | '';
  inStockOnly: boolean;
};
