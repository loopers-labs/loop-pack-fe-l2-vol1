export type ProductCategory = "electronics" | "fashion" | "home" | "beauty";

export type ProductCategoryFilter = "all" | ProductCategory;

export type Product = {
  id: number;
  name: string;
  category: ProductCategory;
  price: number;
  originalPrice?: number;
  stock: number;
  imageUrl: string;
  createdAt: string;
  rating: number;
  reviewCount: number;
};

export type SortBy = "latest" | "popular" | "price-asc" | "price-desc";

export type ViewMode = "grid" | "list";
