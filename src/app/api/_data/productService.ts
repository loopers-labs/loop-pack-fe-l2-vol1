import type {
  Product,
  ProductListQuery,
  ProductListResponse,
} from '@/entities/product/model/types';
import { PRODUCT_LIST_DEFAULTS } from '@/entities/product/model/constants';
import { categories, products } from './commerce';

export function getProductList(
  params: ProductListQuery,
): ProductListResponse {
  const {
    q,
    category,
    sort = PRODUCT_LIST_DEFAULTS.sort,
    page = PRODUCT_LIST_DEFAULTS.page,
    pageSize = PRODUCT_LIST_DEFAULTS.pageSize,
  } = params;
  const keyword = q?.trim().toLocaleLowerCase('ko') ?? '';

  const filtered = products.filter((product) => {
    const matchesCategory =
      !category || category === 'all' || product.category === category;
    const searchable =
      `${product.brand} ${product.name}`.toLocaleLowerCase('ko');
    return matchesCategory && searchable.includes(keyword);
  });

  const sorted = [...filtered];
  sorted.sort((a, b) => {
    switch (sort) {
      case 'popular':
        return b.reviewCount - a.reviewCount || b.rating - a.rating;
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'latest':
        return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    }
  });

  const start = (page - 1) * pageSize;

  return {
    products: sorted.slice(start, start + pageSize),
    categories,
    totalCount: filtered.length,
    page,
    pageSize,
  };
}

export function getProductById(id: string): Product | undefined {
  return products.find((product) => product.id === id);
}
