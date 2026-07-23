'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { homeQueries } from '@/queries/homeQueries';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import type { Category, Product } from '@/types/commerce';

export default function Home() {
  const { data, isLoading, isError } = useQuery(homeQueries.data());

  if (isLoading) return <p>로딩 중...</p>;
  if (isError) return <p>오류가 발생했습니다.</p>;
  if (!data) return null;

  const { banner, categories, popularProducts, newProducts } = data;

  return (
    <main className="week05-page">
      <Header />
      <section className="week05-hero">
        <p>{banner.description}</p>
        <h1>{banner.title}</h1>
      </section>
      <section className="week05-section">
        <h2>카테고리</h2>
        <div className="week05-categories">
          {categories.map((category: Category) => (
            <Link key={category.id} href={`/products?category=${category.id}`}>
              {category.name}
            </Link>
          ))}
        </div>
      </section>
      {[
        { title: '인기 상품', products: popularProducts },
        { title: '신상품', products: newProducts },
      ].map(({ title, products }) => (
        <section className="week05-section" key={title}>
          <h2>{title}</h2>
          <div className="week05-grid">
            {products.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
