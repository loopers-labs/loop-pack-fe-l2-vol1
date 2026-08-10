'use client';

import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CategoryId } from '@/entities/product/model';
import { homeQueries } from '@/_pages/home/api/queries';
import { HomeCategory } from '@/_pages/home/model';
import { ProductCard } from '@/widgets/product-card/ProductCard';
import { Header } from '@/widgets/header/Header';
import { productQueries } from '@/entities/product/api/queries';
import { PAGE_SIZE } from '@/features/product-filters/model/useProductListFilters';
import { HeroSection } from '@/examples/week-07-performance/HeroSection';

const HomeCategoryArr: HomeCategory[] = ['인기 상품', '신상품'] as const;
const ProductCategoryArr: { id: CategoryId; label: string }[] = [
  { id: 'casual', label: '캐주얼' },
  { id: 'fashion', label: '패션' },
  { id: 'goods', label: '뷰티·잡화' },
  { id: 'home', label: '홈' },
  { id: 'digital', label: '디지털' },
] as const;

export const HomeContent = () => {
  const { data, isPending, isError, refetch } = useQuery(homeQueries.home());

  const queryClient = useQueryClient();

  const prefetch = (id: CategoryId) => {
    queryClient.prefetchQuery(
      productQueries.list({ q: '', category: id, sort: 'latest', page: 1, pageSize: PAGE_SIZE })
    );
  };

  const renderItems = () => {
    if (isPending) {
      return <p>불러오는 중...</p>;
    }
    if (isError) {
      return (
        <p role="alert">
          상품을 불러오지 못했습니다.{' '}
          <button type="button" onClick={() => refetch()}>
            다시 시도
          </button>
        </p>
      );
    }

    return HomeCategoryArr.map((title) => {
      const list = title === '인기 상품' ? data.popularProducts : data.newProducts;
      return (
        <section className="section" key={title}>
          <h2>{title}</h2>
          <div className="grid">
            {list.length === 0 ? (
              <p>검색 결과가 없습니다.</p>
            ) : (
              list.map((product) => <ProductCard key={product.id} product={product} />)
            )}
          </div>
        </section>
      );
    });
  };

  return (
    <main className="page">
      <Header />
      <HeroSection title="제목" description="설명" />
      <section className="section">
        <h2>카테고리</h2>
        <div className="categories">
          {/* [AI] 클릭 시 /products?category=<id> 로 이동해 해당 카테고리가 적용된다. */}
          {ProductCategoryArr.map(({ id, label }) => (
            <Link
              key={id}
              href={`/products?category=${id}`}
              onMouseEnter={() => prefetch(id)}
              onFocus={() => prefetch(id)}
            >
              {label}
            </Link>
          ))}
        </div>
      </section>
      {renderItems()}
    </main>
  );
};
