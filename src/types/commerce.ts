export type CategoryId = 'casual' | 'fashion' | 'goods' | 'home' | 'digital';

export type Category = {
  id: CategoryId;
  name: string;
};

export type ProductSort = 'latest' | 'popular' | 'price-asc' | 'price-desc';

export type MockApiScenario = 'empty' | 'error';

export type ProductListQuery = {
  q?: string;
  category?: CategoryId | 'all';
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
};

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

export type ApiErrorResponse = {
  message: string;
};

// Product 객체 전체를 저장한은 게 아니라 최소 정보만 저장한다.
export type WishListItem = Pick<Product, 'id' | 'name' | 'price' | 'image'>;
export type CartItem = Pick<Product, 'id' | 'name' | 'price' | 'image'>;
