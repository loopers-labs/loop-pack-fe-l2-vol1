'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import { ProductCard } from '@/features/products/ProductCard';
import { productQueries } from '@/features/products/queries';

export default function ProductsPage() {
  return (
    <main className="week05-page">
      <header className="week05-header">
        <Link href="/">Commerce</Link>
        <nav aria-label="주요 메뉴">
          <Link href="/products">상품</Link>
        </nav>
      </header>

      <section className="week05-section" aria-label="상품 검색 결과">
        <h1>상품 목록</h1>
        <ProductList />
      </section>
    </main>
  );
}

function ProductList() {
  // FIEMX: URL parser 결과로 교체한다.
  const { data, isPending, isError, error } = useQuery(
    productQueries.list({
      q: '',
      category: 'all',
      sort: 'latest',
      page: 1,
      pageSize: 12,
    }),
  );

  if (isPending) {
    return (
      <p className="week05-status" role="status">
        상품 목록을 불러오는 중입니다…
      </p>
    );
  }

  if (isError) {
    return (
      <p className="week05-status" role="alert">
        {error.message}
      </p>
    );
  }

  return (
    <>
      <p>총 {data.totalCount}개</p>
      {data.totalCount === 0 ? (
        <p className="week05-empty">조건에 맞는 상품이 없습니다.</p>
      ) : (
        <div className="week05-grid">
          {data.products.map((product) => (
            <ProductCard key={product.id} product={product} headingLevel="h2" />
          ))}
        </div>
      )}
    </>
  );
}
