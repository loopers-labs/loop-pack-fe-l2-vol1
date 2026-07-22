'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { homeQueries } from '@/features/home/home.queries';
import type { Product } from '@/types/commerce';
import '@/examples/week-05-layout/week-05-layout.css';

function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="week05-grid">
      {products.map((product) => (
        <article className="week05-product" key={product.id}>
          <Image
            className="week05-image"
            src={product.image}
            alt={product.name}
            width={400}
            height={400}
          />
          <p>{product.brand}</p>
          <h3>{product.name}</h3>
          <strong>{product.price.toLocaleString()}원</strong>
        </article>
      ))}
    </div>
  );
}

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
      <header className="week05-header">
        <Link href="/">Commerce</Link>
        <nav aria-label="주요 메뉴">
          <Link href="/products">상품</Link>
        </nav>
      </header>

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
