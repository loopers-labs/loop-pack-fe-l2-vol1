import { categories, products, waitForMockApi } from '@/app/api/_data/commerce';
import type { ApiErrorResponse, MockApiScenario, ProductListResponse, ProductSort } from '@/types/commerce';
import { NextRequest, NextResponse } from 'next/server';

const sortValues = ['latest', 'popular', 'price-asc', 'price-desc'] as const satisfies readonly ProductSort[];
const scenarioValues = ['empty', 'error'] as const satisfies readonly MockApiScenario[];

const isProductSort = (value: string): value is ProductSort => sortValues.some((sort) => sort === value);

const isMockApiScenario = (value: string): value is MockApiScenario =>
  scenarioValues.some((scenario) => scenario === value);

const isPositiveInteger = (value: string | null) => value !== null && /^[1-9]\d*$/.test(value);

export async function GET(request: NextRequest): Promise<NextResponse<ProductListResponse | ApiErrorResponse>> {
  const params = request.nextUrl.searchParams;
  const scenario = params.get('scenario');
  const q = params.get('q')?.trim().toLocaleLowerCase('ko') ?? '';
  const category = params.get('category');
  const sort = params.get('sort');
  const pageValue = params.get('page') ?? '1';
  const pageSizeValue = params.get('pageSize') ?? '12';
  const page = Number(pageValue);
  const pageSize = Number(pageSizeValue);

  if (scenario !== null && !isMockApiScenario(scenario)) {
    return NextResponse.json({ message: '요청 조건을 확인해주세요.' }, { status: 400 });
  }

  if (sort !== null && !isProductSort(sort)) {
    return NextResponse.json({ message: '요청 조건을 확인해주세요.' }, { status: 400 });
  }

  const validCategory = category === null || category === 'all' || categories.some((item) => item.id === category);
  const validPage = isPositiveInteger(pageValue) && Number.isSafeInteger(page);
  const validPageSize = isPositiveInteger(pageSizeValue) && Number.isSafeInteger(pageSize) && pageSize <= 24;

  if (!validCategory || !validPage || !validPageSize) {
    return NextResponse.json({ message: '요청 조건을 확인해주세요.' }, { status: 400 });
  }

  await waitForMockApi();

  if (scenario === 'error') {
    return NextResponse.json({ message: '상품 목록을 불러오지 못했습니다.' }, { status: 500 });
  }

  const filteredProducts = products.filter((product) => {
    const matchesCategory = category === null || category === 'all' || product.category === category;
    const searchable = `${product.brand} ${product.name}`.toLocaleLowerCase('ko');
    return matchesCategory && searchable.includes(q);
  });

  const sortedProducts = [...filteredProducts];

  if (sort !== null) {
    sortedProducts.sort((a, b) => {
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
  }

  const start = (page - 1) * pageSize;
  const pagedProducts = sortedProducts.slice(start, start + pageSize);
  const responseProducts = scenario === 'empty' ? [] : pagedProducts;
  const totalCount = scenario === 'empty' ? 0 : filteredProducts.length;

  return NextResponse.json({
    products: responseProducts,
    categories,
    totalCount,
    page,
    pageSize,
  });
}
