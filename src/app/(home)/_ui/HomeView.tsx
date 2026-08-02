'use client';

import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import '../../layout.css';
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

export function HomeView() {
  const homeQuery = useQuery(homeQueryOptions());
  const queryClient = useQueryClient();

  const prefetchProductList = (categoryId: CategoryId | 'all') => {
    queryClient.prefetchQuery(
      productsQueryOptions({
        ...DEFAULT_PRODUCT_LIST_QUERY,
        category: categoryId,
      }),
    );
  };

  return (
    <main className="week05-page">
      <Header />
      <QueryState
        query={homeQuery}
        renderError={(error) => (
          <ErrorRetry message={error.message} onRetry={() => homeQuery.refetch()} />
        )}
      >
        {(data) => {
          // 배너는 어떤 entity에도 속하지 않는 순수 페이지 콘텐츠라 mapper 없이 여기서 바로 뽑는다.
          // 카테고리/인기·신상품은 각 entity가 소유한 mapper로 projection한다.
          const categories = categoriesMapper(data);
          const popularProducts = popularProductsMapper(data);
          const newProducts = newProductsMapper(data);

          return (
            <>
              <PageHeading title={data.banner.title} description={data.banner.description} />
              <section className="week05-section">
                <h2>카테고리</h2>
                <div className="week05-categories">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/products?category=${category.id}`}
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
                  <h2>{title}</h2>
                </ProductListSection>
              ))}
            </>
          );
        }}
      </QueryState>
    </main>
  );
}
