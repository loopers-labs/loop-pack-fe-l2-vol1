type Product = {
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

type ProductListResponse = {
  products: Product[];
  totalCount: number;
};

type SortBy = "latest" | "popular" | "price-asc" | "price-desc";

type ViewMode = "grid" | "list";

export type { Product, ProductListResponse, SortBy, ViewMode };
