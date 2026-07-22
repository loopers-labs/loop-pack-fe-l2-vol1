'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { homeQueries } from '@/queries/homeQueries';

export default function Home() {
  const { data, isLoading, isError } = useQuery(homeQueries.data());

  if (isLoading) return <p>로딩 중...</p>;
  if (isError) return <p>오류가 발생했습니다.</p>;
  if (!data) return null;

  const { banner, categories, popularProducts, newProducts } = data;

  return (
    <main className="week05-page">
      <header className="week05-header">
        <Link href="/">Commerce</Link>
        <nav aria-label="주요 메뉴">
          <Link href="/products">상품</Link>
          <span>위시리스트 0</span>
          <span>장바구니 0</span>
        </nav>
      </header>
      <section className="week05-hero">
        <p>{banner.description}</p>
        <h1>{banner.title}</h1>
      </section>
      <section className="week05-section">
        <h2>카테고리</h2>
        <div className="week05-categories">
          {categories.map((category) => (
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
                <div>
                  <button
                    type="button"
                    aria-label={`${product.name} 위시리스트`}
                    aria-pressed={false}
                  >
                    찜
                  </button>
                  <button
                    type="button"
                    aria-label={`${product.name} 장바구니`}
                    aria-pressed={false}
                  >
                    담기
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
