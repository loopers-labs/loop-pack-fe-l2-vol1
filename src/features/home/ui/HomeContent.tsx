'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CategoryId } from '@/types/commerce';
import { homeQueries } from '@/features/home/api/queries';
import { HomeCategory } from '@/features/home/types';
import { ProductCard } from '@/features/product/ui/ProductCard';
import { Header } from '@/widgets/Header';

const HomeCategoryArr: HomeCategory[] = ['인기 상품', '신상품'] as const;
const ProductCategoryArr: { id: CategoryId; label: string }[] = [
  { id: 'casual', label: '캐주얼' },
  { id: 'fashion', label: '패션' },
  { id: 'goods', label: '뷰티·잡화' },
  { id: 'home', label: '홈' },
  { id: 'digital', label: '디지털' },
] as const;

export const HomeContent = () => {
  const { data, isPending, isError } = useQuery(homeQueries.home());

  const renderItems = () => {
    if (isPending) {
      return <p>불러오는 중...</p>;
    }
    if (isError) {
      return <p role="alert">상품을 불러오지 못했습니다.</p>;
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
      <section className="hero">
        <p>배너 설명</p>
        <h1>홈 배너 제목</h1>
      </section>
      <section className="section">
        <h2>카테고리</h2>
        <div className="categories">
          {/* [AI] 클릭 시 /products?category=<id> 로 이동해 해당 카테고리가 적용된다. */}
          {ProductCategoryArr.map(({ id, label }) => (
            <Link key={id} href={`/products?category=${id}`}>
              {label}
            </Link>
          ))}
        </div>
      </section>
      {renderItems()}
    </main>
  );
};
