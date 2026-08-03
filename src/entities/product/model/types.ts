export type CategoryId = "casual" | "fashion" | "goods" | "home" | "digital";

export type Category = {
  id: CategoryId;
  name: string;
};

export type ProductSort = "latest" | "popular" | "price-asc" | "price-desc";

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

// 서버와 클라이언트가 공유하는 응답 계약. mock 백엔드(app/api)도 이 타입을 지킨다.
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
