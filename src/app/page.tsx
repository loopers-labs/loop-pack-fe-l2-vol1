'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import { ProductCard } from '@/features/products/ProductCard';
import { productQueries } from '@/features/products/queries';

export default function HomePage() {
  const { data, isPending, isError, error } = useQuery(productQueries.home());

  // FIXME: Suspense 고려
  if (isPending) {
    return (
      <main className="week05-page">
        <p className="week05-status" role="status">
          홈을 불러오는 중입니다…
        </p>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="week05-page">
        <p className="week05-status" role="alert">
          {error.message}
        </p>
      </main>
    );
  }

  const { banner, categories, popularProducts, newProducts } = data;

  return (
    <main className="week05-page">
      <header className="week05-header">
        <Link href="/">Commerce</Link>
        <nav aria-label="주요 메뉴">
          <Link href="/products">상품</Link>
        </nav>
      </header>

      <section
        className="week05-hero"
        style={{ backgroundImage: `url(${banner.image})` }}
      >
        <p>{banner.description}</p>
        <h1>{banner.title}</h1>
      </section>

      <section className="week05-section">
        <h2>카테고리</h2>
        <div className="week05-categories">
          {categories.map((category) => (
            <span key={category.id}>{category.name}</span>
          ))}
        </div>
      </section>

      <section className="week05-section">
        <h2>인기 상품</h2>
        {popularProducts.length === 0 ? (
          <p className="week05-empty">표시할 상품이 없습니다.</p>
        ) : (
          <div className="week05-grid">
            {popularProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                headingLevel="h3"
              />
            ))}
          </div>
        )}
      </section>

      <section className="week05-section">
        <h2>신상품</h2>
        {newProducts.length === 0 ? (
          <p className="week05-empty">표시할 상품이 없습니다.</p>
        ) : (
          <div className="week05-grid">
            {newProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                headingLevel="h3"
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
