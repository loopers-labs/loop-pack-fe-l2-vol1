// [AI] 얇은 라우팅 진입점. 비즈니스는 widgets/product-list에 위임.
// Suspense는 nuqs useQueryStates가 내부적으로 쓰는 useSearchParams()의 정적 프리렌더 bailout 방지.
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProductList } from '@/_pages/product/ui/ProductList';
import { DEFAULT_PRODUCT_LIST_QUERY, productQueries } from '@/entities/product/api/queries';
import type { ProductListQuery, ProductSort } from '@/entities/product/model';
import { getQueryClient } from '@/shared/api/getQueryClient';
import { commonOpenGraph } from '../layout';

// [AI] 정렬값 → 한국어 라벨. description에 노출된다.
const SORT_LABELS: Record<ProductSort, string> = {
  latest: '최신순',
  popular: '인기순',
  'price-asc': '낮은 가격순',
  'price-desc': '높은 가격순',
};

// [AI] searchParams 배열/단일 값을 단일 문자열로 꺼낸다.
const toSingle = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

// [AI] 정렬값 검증 — route.ts의 isProductSort와 동일 패턴(type assertion 없이 좁힌다).
const SORT_VALUES = [
  'latest',
  'popular',
  'price-asc',
  'price-desc',
] as const satisfies readonly ProductSort[];
const isProductSort = (value: string | undefined): value is ProductSort =>
  value !== undefined && SORT_VALUES.some((s) => s === value);

// [AI] 카테고리값 검증. 'use client' 파일에서 안전하게 import할 수 없어 로컬로 둔다.
const CATEGORY_VALUES = [
  'all',
  'casual',
  'fashion',
  'goods',
  'home',
  'digital',
] as const satisfies readonly ProductListQuery['category'][];
const isProductCategory = (value: string | undefined): value is ProductListQuery['category'] =>
  value !== undefined && CATEGORY_VALUES.some((c) => c === value);

// [AI] searchParams를 useProductListFilters의 기본값과 동일하게 정규화한다.
// 클라이언트와 같은 query를 만들어야 같은 query key → 같은 캐시가 적중한다.
const buildProductQuery = (
  searchParams: Record<string, string | string[] | undefined>
): ProductListQuery => {
  const categoryRaw = toSingle(searchParams.category);
  const sortRaw = toSingle(searchParams.sort);
  const page = Number(toSingle(searchParams.page));
  return {
    q: toSingle(searchParams.q) ?? '',
    category: isProductCategory(categoryRaw) ? categoryRaw : 'all',
    sort: isProductSort(sortRaw) ? sortRaw : 'latest',
    page: Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1,
    pageSize: DEFAULT_PRODUCT_LIST_QUERY.pageSize,
  };
};

// [AI] 정규화된 canonical 경로. 기본값과 같은 파라미터는 생략해 깔끔한 URL을 만든다.
const buildCanonicalPath = (query: ProductListQuery): string => {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.category && query.category !== 'all') params.set('category', query.category);
  if (query.sort && query.sort !== 'latest') params.set('sort', query.sort);
  if (query.page && query.page > 1) params.set('page', String(query.page));
  const qs = params.toString();
  return qs ? `/products?${qs}` : '/products';
};

// [AI] 상품 목록 metadata: 본문과 같은 query factory(productQueries.list)로
// 카테고리명·전체개수·첫 이미지를 가져와 title·description·OG를 채운다.
// 검색어→title, category·sort·전체개수→description, 2페이지 이상→title 규칙.
// fetch 실패 시 빈 객체를 돌려 root 고정값이 상속되게 한다(query failure는 edge case 단계에서 별도 검증).
export const generateMetadata = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> => {
  const query = buildProductQuery(await searchParams);
  const queryClient = getQueryClient();
  try {
    const data = await queryClient.fetchQuery(productQueries.list(query));
    const categoryName =
      query.category === 'all' || !query.category
        ? '전체'
        : (data.categories.find((c) => c.id === query.category)?.name ?? '전체');
    const sortLabel = SORT_LABELS[query.sort ?? 'latest'] ?? '최신순';

    // [AI] 검색어→title, 2페이지 이상→title 규칙
    const baseTitle = query.q ? `'${query.q}' 검색 결과` : '상품 목록';
    const title = query.page && query.page > 1 ? `${baseTitle} - ${query.page}페이지` : baseTitle;

    // [AI] category·sort·전체개수 → description
    const description = `${categoryName} 상품 ${data.totalCount}건, ${sortLabel}으로 만나보세요.`;
    const image = data.products[0]?.image;

    return {
      title,
      description,
      alternates: { canonical: buildCanonicalPath(query) },
      openGraph: {
        ...commonOpenGraph,
        title,
        description,
        ...(image ? { images: [{ url: image }] } : {}),
      },
    };
  } catch {
    return {};
  }
};

const ProductsPage = () => (
  <Suspense fallback={null}>
    <ProductList />
  </Suspense>
);

export default ProductsPage;
