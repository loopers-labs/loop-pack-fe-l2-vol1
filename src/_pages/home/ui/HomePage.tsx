'use client';

import { ProductCard } from '@/entities/product';
import { AddToCartButton } from '@/features/add-to-cart';
import { WishlistToggleButton } from '@/features/toggle-wishlist';
import { useSuspenseQuery } from '@tanstack/react-query';
import Link from 'next/link';

import { homeQueryOptions } from '../api/homeQueries';

/**
 * 홈의 카테고리와 상품 목록. 서버에서 prefetch된 캐시를 hydrate 받아 조회한다.
 * 로딩, 에러는 상위 HomePageBoundary 의 Suspense, ErrorBoundary 가 맡고,
 * 여기서는 데이터가 있는 성공 경로와 빈 상태만 다룬다.
 *
 * Hero 는 여기 없다. 배경 이미지가 정적이라 데이터를 기다릴 이유가 없어 페이지가 경계 밖에서 조립한다.
 */
export function HomePage() {
  const { data } = useSuspenseQuery(homeQueryOptions.list());

  const { categories, popularProducts, newProducts } = data;

  const sections = [
    { title: '인기 상품', products: popularProducts },
    { title: '신상품', products: newProducts },
  ];

  return (
    <>
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

      {sections.map(({ title, products }) => (
        <section className="week05-section" key={title}>
          <h2>{title}</h2>
          {products.length === 0 ? (
            <p>표시할 상품이 없습니다.</p>
          ) : (
            <div className="week05-grid">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  actions={
                    <>
                      <WishlistToggleButton productId={product.id} productName={product.name} />
                      <AddToCartButton productId={product.id} productName={product.name} />
                    </>
                  }
                />
              ))}
            </div>
          )}
        </section>
      ))}
    </>
  );
}
