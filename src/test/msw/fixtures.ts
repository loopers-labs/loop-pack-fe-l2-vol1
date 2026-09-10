import type {
  Category,
  CategoryId,
  HomeResponse,
  Product,
  ProductListResponse,
  ProductSort,
} from "@/types/commerce";
import type { AuthUser, Order } from "@/types/auth";

const CATEGORY_IDS: CategoryId[] = ["casual", "fashion", "goods", "home", "digital"];

const CATEGORIES: Category[] = CATEGORY_IDS.map((id) => ({
  id,
  name: id,
}));

const PRODUCTS_PER_CATEGORY = 5;

export function buildProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "product-1",
    brand: "test-brand",
    name: "test-product",
    category: "casual",
    price: 10000,
    originalPrice: null,
    image: "/images/test-product.jpg",
    freeShipping: true,
    sizes: [{ value: 260, stock: 10 }],
    rating: 4.0,
    reviewCount: 10,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

// 이름이 `casual-1`처럼 카테고리·순번으로 구분되는 결정적 카탈로그.
// price는 순번에 비례, createdAt·reviewCount는 순번에 반비례하도록 어긋나게 두어
// 정렬 방식이 바뀌면 화면의 순서도 달라진다.
function buildCatalog(): Product[] {
  return CATEGORY_IDS.flatMap((category, categoryIndex) =>
    Array.from({ length: PRODUCTS_PER_CATEGORY }, (_, i) => {
      const n = i + 1;
      const serial = categoryIndex * PRODUCTS_PER_CATEGORY + n;
      return buildProduct({
        id: `${category}-${n}`,
        name: `${category}-${n}`,
        brand: `${category}-brand`,
        category,
        price: 1000 * serial,
        originalPrice: n % 2 === 0 ? 1000 * serial + 500 : null,
        rating: 3 + (n % 3),
        reviewCount: (PRODUCTS_PER_CATEGORY - i) * 10 + categoryIndex,
        createdAt: new Date(Date.UTC(2026, 0, 30 - serial)).toISOString(),
      });
    }),
  );
}

const SORTERS: Record<ProductSort, (a: Product, b: Product) => number> = {
  latest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  popular: (a, b) => b.reviewCount - a.reviewCount,
  "price-asc": (a, b) => a.price - b.price,
  "price-desc": (a, b) => b.price - a.price,
};

type ProductListParams = {
  q?: string;
  category?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
};

export function buildProductListResponse({
  q = "",
  category = "all",
  sort = "latest",
  page = 1,
  pageSize = 12,
}: ProductListParams = {}): ProductListResponse {
  let products = buildCatalog();

  if (category !== "all") {
    products = products.filter((p) => p.category === category);
  }

  const keyword = q.trim();
  if (keyword) {
    products = products.filter((p) => p.name.includes(keyword));
  }

  const sorter = SORTERS[sort as ProductSort] ?? SORTERS.latest;
  products = [...products].sort(sorter);

  const totalCount = products.length;
  const start = (page - 1) * pageSize;

  return {
    products: products.slice(start, start + pageSize),
    categories: CATEGORIES,
    totalCount,
    page,
    pageSize,
  };
}

export function buildHomeResponse(overrides: Partial<HomeResponse> = {}): HomeResponse {
  const catalog = buildCatalog();
  return {
    banner: {
      title: "test-banner",
      description: "test-banner-description",
      image: "/images/test-banner.jpg",
    },
    categories: CATEGORIES,
    popularProducts: catalog.slice(0, 4),
    newProducts: catalog.slice(4, 8),
    ...overrides,
  };
}

export function buildAuthUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: "u1",
    name: "루퍼1",
    email: "looper1@loopers.dev",
    ...overrides,
  };
}

export function buildOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "o1",
    createdAt: "2026-09-01T09:00:00.000Z",
    items: [{ productId: "casual-1", quantity: 1 }],
    ...overrides,
  };
}
