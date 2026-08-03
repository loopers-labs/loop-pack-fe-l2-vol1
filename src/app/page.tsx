'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { homeQueries } from '@/queries/homeQueries';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import type { Category, Product } from '@/types/commerce';

export default function Home() {
  const { data, isLoading, isError, refetch } = useQuery(homeQueries.data());

  return (
    <main className="week05-page">
      <Header />
      {isLoading && <p>로딩 중...</p>}
      {isError && (
        <section className="week05-section week05-error">
          <p>오류가 발생했습니다.</p>
          <button type="button" onClick={() => void refetch()}>
            다시 시도
          </button>
        </section>
      )}
      {data && (
        <>
          <section className="week05-hero">
            <p>{data.banner.description}</p>
            <h1>{data.banner.title}</h1>
          </section>
          <section className="week05-section">
            <h2>카테고리</h2>
            <div className="week05-categories">
              {data.categories.map((category: Category) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.id}`}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </section>
          {[
            { title: '인기 상품', products: data.popularProducts },
            { title: '신상품', products: data.newProducts },
          ].map(({ title, products }) => (
            <section className="week05-section" key={title}>
              <h2>{title}</h2>
              {products.length === 0 ? (
                <p>상품이 없습니다.</p>
              ) : (
                <div className="week05-grid">
                  {products.map((product: Product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </section>
          ))}
        </>
      )}
    </main>
  );
}
