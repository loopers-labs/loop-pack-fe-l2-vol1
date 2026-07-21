'use client';

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';

import './home.css';

import { productQueries } from '@/features/products/queries';
import type { Product } from '@/types/commerce';

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
              <ProductCard key={product.id} product={product} />
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
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <article className="week05-product">
      <Image
        className="week05-image"
        src={product.image}
        alt={product.name}
        width={400}
        height={400}
      />
      <p className="week05-brand">{product.brand}</p>
      <h3 className="week05-name">{product.name}</h3>
      <div className="week05-price">
        <strong>{product.price.toLocaleString()}원</strong>
        {product.originalPrice !== null && (
          <span className="week05-original">
            {product.originalPrice.toLocaleString()}원
          </span>
        )}
      </div>
    </article>
  );
}
