'use client';

import { useQuery } from '@tanstack/react-query';
import { homeQueries } from '@/features/home/home.queries';
import { SiteHeader } from '@/components/SiteHeader';
import { ProductGrid } from '@/components/ProductGrid';
import '@/examples/week-05-layout/week-05-layout.css';

export default function Home() {
  const { data, isPending, isError, refetch } = useQuery(homeQueries.home());

  if (isPending) return <p>불러오는 중…</p>;

  if (isError)
    return (
      <div role="alert">
        <p>홈 데이터를 불러오지 못했어요.</p>
        <button type="button" onClick={() => void refetch()}>
          다시 시도
        </button>
      </div>
    );

  return (
    <main className="week05-page">
      <SiteHeader />

      <section className="week05-section">
        <h1>{data.banner.title}</h1>
        <p>{data.banner.description}</p>
      </section>

      <section className="week05-section" aria-label="카테고리">
        <h2>카테고리</h2>
        <ul>
          {data.categories.map((category) => (
            <li key={category.id}>{category.name}</li>
          ))}
        </ul>
      </section>

      <section className="week05-section" aria-label="인기 상품">
        <h2>인기 상품</h2>
        {data.popularProducts.length === 0 ? (
          <p>인기 상품이 없어요.</p>
        ) : (
          <ProductGrid products={data.popularProducts} />
        )}
      </section>

      <section className="week05-section" aria-label="신상품">
        <h2>신상품</h2>
        {data.newProducts.length === 0 ? (
          <p>신상품이 없어요.</p>
        ) : (
          <ProductGrid products={data.newProducts} />
        )}
      </section>
    </main>
  );
}
