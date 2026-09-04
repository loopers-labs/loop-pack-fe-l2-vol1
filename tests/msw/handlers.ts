import { http, HttpResponse } from 'msw';

import {
  CATEGORIES,
  HOME_RESPONSE,
  PRODUCTS,
  SESSION_PASSWORD,
  SESSION_USER,
} from './fixtures';

import {
  PRODUCT_SORTS,
  type Product,
  type ProductListResponse,
  type ProductSort,
} from '@/entities/product';
import type { LoginRequest, SessionResponse } from '@/features/auth';

const DEFAULT_PAGE_SIZE = 12;

const SORT_COMPARATORS: Record<
  ProductSort,
  (a: Product, b: Product) => number
> = {
  latest: (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  popular: (a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
};

const isProductSort = (value: string | null): value is ProductSort =>
  PRODUCT_SORTS.some((sort) => sort === value);

const matches = (product: Product, category: string, keyword: string) => {
  const inCategory = category === 'all' || product.category === category;
  const searchable = `${product.brand} ${product.name}`.toLocaleLowerCase('ko');

  return inCategory && searchable.includes(keyword);
};

/** 성공 경로만 만든다. 실패·지연·빈 결과는 그것을 확인하는 테스트가 덮는다. */
export const productListResponse = (
  searchParams: URLSearchParams,
): ProductListResponse => {
  const keyword = searchParams.get('q')?.trim().toLocaleLowerCase('ko') ?? '';
  const category = searchParams.get('category') ?? 'all';
  const sort = searchParams.get('sort');
  const page = Number(searchParams.get('page') ?? 1);
  const pageSize = Number(searchParams.get('pageSize') ?? DEFAULT_PAGE_SIZE);

  const matched = PRODUCTS.filter((product) =>
    matches(product, category, keyword),
  );
  const sorted = isProductSort(sort)
    ? [...matched].sort(SORT_COMPARATORS[sort])
    : matched;
  const start = (page - 1) * pageSize;

  return {
    products: sorted.slice(start, start + pageSize),
    categories: CATEGORIES,
    totalCount: matched.length,
    page,
    pageSize,
  };
};

const isLoginRequest = (body: unknown): body is LoginRequest =>
  typeof body === 'object' &&
  body !== null &&
  typeof (body as LoginRequest).email === 'string' &&
  typeof (body as LoginRequest).password === 'string';

export const handlers = [
  http.get('*/api/home', () => HttpResponse.json(HOME_RESPONSE)),
  http.get('*/api/products', ({ request }) =>
    HttpResponse.json(productListResponse(new URL(request.url).searchParams)),
  ),
  /**
   * 로그인만은 요청 계약을 검사한다. 본문 형태와 자격 증명을 확인하지 않으면
   * 직렬화가 깨져도 통합 테스트가 통과해 API 연결을 단언하지 못한다.
   */
  http.post('*/api/auth/login', async ({ request }) => {
    const body: unknown = await request.json().catch(() => null);

    if (!isLoginRequest(body)) {
      return HttpResponse.json(
        { message: '요청 조건을 확인해주세요.' },
        { status: 400 },
      );
    }

    if (
      body.email !== SESSION_USER.email ||
      body.password !== SESSION_PASSWORD
    ) {
      return HttpResponse.json(
        { message: '이메일 또는 비밀번호를 확인해주세요.' },
        { status: 401 },
      );
    }

    return HttpResponse.json<SessionResponse>({ user: SESSION_USER });
  }),
  http.post('*/api/auth/logout', () => new HttpResponse(null, { status: 204 })),
];
