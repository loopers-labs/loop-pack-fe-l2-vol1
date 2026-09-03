'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/widgets/header/ui/Header';
import { ProductListSection } from '@/widgets/product-list-section/ui/ProductListSection';
import { PageHeading } from '@/shared/ui/PageHeading/PageHeading';
import { QueryState } from '@/shared/ui/QueryState';
import { ErrorRetry } from '@/shared/ui/ErrorRetry/ErrorRetry';
import { homeQueryOptions } from '../_api/homeQueryOptions';
import type { Product } from '@/entities/product/model/product';
import { DEFAULT_PRODUCT_LIST_QUERY } from '@/entities/product/model/product';
import { popularProductsMapper } from '@/entities/product/model/popularProductsMapper';
import { newProductsMapper } from '@/entities/product/model/newProductsMapper';
import { categoriesMapper } from '@/entities/category/model/categoriesMapper';
import type { CategoryId } from '@/entities/category/model/category';
import { productsQueryOptions } from '@/entities/product/api/productsQueryOptions';

/* AI-generated : Week 7 Part 3 — 제목 계층 정리. PageHeading의 페이지 제목이 h2인데 섹션 제목("카테고리",
   "인기 상품", "신상품")도 같은 h2여서 한 페이지에 h2가 4개로 평평했다. 섹션 제목을 h3로 내려
   "페이지 제목 h2 하나 + 그 아래 섹션 h3" 구조로 만든다 */
/* AI-generated : Week 7 Part 1 — PageHeading을 QueryState 밖으로 빼서 Header처럼 homeQuery pending 여부와 무관하게 즉시 렌더. 배너 데이터 도착 전엔 고정 fallback 문구를 보여주다가 도착하면 실제 title/description으로 교체 */
export function HomeView() {
  const homeQuery = useQuery(homeQueryOptions());
  const queryClient = useQueryClient();
  const router = useRouter();

  /* AI-generated : Week 7 Part 4 — Link의 href와 router.prefetch가 반드시 같은 문자열을 쓰도록 한 곳에서 만든다.
     두 곳이 어긋나면 프리페치한 라우트와 실제로 이동하는 라우트가 달라져 예열이 조용히 무효가 된다 */
  const buildCategoryHref = (categoryId: CategoryId | 'all') => `/products?category=${categoryId}`;

  /* AI-generated : Week 7 Part 4 — 카테고리 Link의 viewport 자동 프리페치가 첫 로드에 RSC 요청 10건을 쏘는데,
     같은 목적의 예열을 아래 onMouseEnter가 이미 하고 있어 중복이었다. prefetch={false}는 hover 프리페치까지
     끄므로, 여기서 router.prefetch를 직접 불러 "첫 로드에는 안 쏘고 hover에서 라우트+데이터를 함께 예열"로
     시점만 옮긴다(요청 41→32건).
     주의 — 이 변경을 "서버 응답 추정치를 낮춰 FCP를 줄인다"는 이유로 넣었으나 실측에서 반증됐다.
     network-server-latency는 574 → 581ms로 그대로였고 FCP 개선은 전부 CSS 인라인에서 나왔다.
     그 574ms의 실제 출처는 요청 경합이 아니라 mock API에 심어둔 500ms 지연이다(실측: 문서 TTFB 2.1ms,
     /api/home 502.2ms). 같은 이유로 프리페치를 더 줄여도 FCP는 움직이지 않으니 다시 시도하지 말 것.
     중복 요청을 없앤 것 자체가 옳아서 유지한다 */
  const prefetchProductList = (categoryId: CategoryId | 'all') => {
    router.prefetch(buildCategoryHref(categoryId));
    queryClient.prefetchQuery(
      productsQueryOptions({
        ...DEFAULT_PRODUCT_LIST_QUERY,
        category: categoryId,
      }),
    );
  };

  return (
    <div className="week05-page">
      <Header />
      <main>
        <PageHeading
          title={homeQuery.data?.banner.title ?? '다양한 상품을 만나보세요'}
          description={homeQuery.data?.banner.description ?? '지금 준비된 상품을 확인해보세요.'}
        />
        <QueryState
          query={homeQuery}
          renderError={(error) => (
            <ErrorRetry message={error.message} onRetry={() => homeQuery.refetch()} />
          )}
        >
          {(data) => {
            // 배너는 PageHeading이 QueryState 밖에서 이미 소유하므로 여기서는 카테고리/인기·신상품만 각 entity의 mapper로 projection한다.
            const categories = categoriesMapper(data);
            const popularProducts = popularProductsMapper(data);
            const newProducts = newProductsMapper(data);

            return (
              <>
                <section className="week05-section">
                  <h3>카테고리</h3>
                  <div className="week05-categories">
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        href={buildCategoryHref(category.id)}
                        prefetch={false}
                        onMouseEnter={() => prefetchProductList(category.id)}
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </section>
                {(
                  [
                    { title: '인기 상품', products: popularProducts },
                    { title: '신상품', products: newProducts },
                  ] satisfies { title: string; products: Product[] }[]
                ).map(({ title, products }) => (
                  <ProductListSection
                    key={title}
                    products={products}
                    emptyMessage="상품이 없습니다."
                    labelPrefix={title}
                  >
                    <h3>{title}</h3>
                  </ProductListSection>
                ))}
              </>
            );
          }}
        </QueryState>
      </main>
    </div>
  );
}
