// [AI 생성] 3주차 관심사 분리 — 도메인 타입만 모음 (검토·수정)

export type Category = "electronics" | "fashion" | "home" | "beauty";
export type CategoryFilter = "all" | Category;
export type SortBy = "latest" | "popular" | "price-asc" | "price-desc";
export type ViewMode = "grid" | "list";

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
