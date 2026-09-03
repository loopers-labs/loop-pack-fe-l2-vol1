import { http, HttpResponse } from 'msw';
import { categories, homeBanner, products } from '@/app/api/_data/commerce';
import type { HomeResponse, ProductListResponse } from '@/entities/product/model/product';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 12;
const HOME_PRODUCT_COUNT = 6;

export const defaultHomeResponse: HomeResponse = {
  banner: homeBanner,
  categories,
  popularProducts: products.slice(0, HOME_PRODUCT_COUNT),
  newProducts: products.slice(0, HOME_PRODUCT_COUNT),
};

export const defaultProductListResponse: ProductListResponse = {
  products: products.slice(0, DEFAULT_PAGE_SIZE),
  categories,
  totalCount: products.length,
  page: DEFAULT_PAGE,
  pageSize: DEFAULT_PAGE_SIZE,
};

export const handlers = [
  http.get('*/api/home', () => HttpResponse.json(defaultHomeResponse)),
  http.get('*/api/products', () => HttpResponse.json(defaultProductListResponse)),
  http.get('*/api/auth/me', () =>
    HttpResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 }),
  ),
];
