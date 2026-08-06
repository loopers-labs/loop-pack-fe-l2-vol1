'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { homeQueries } from '@/_pages/home/api/homeQueries';
import { ProductCard } from '@/widgets/product-card';
import type { Category, Product } from '@/entities/product/model';
import { Hero } from '@/widgets/hero';

export function HomePage() {
  const { data, isLoading, isError, refetch } = useQuery(homeQueries.data());

  return (
    <>
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
          <Hero title={data.banner.title} description={data.banner.description} />
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
    </>
  );
}
