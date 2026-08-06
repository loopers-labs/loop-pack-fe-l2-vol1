'use client';

import { useQuery } from '@tanstack/react-query';
import { homeQueries } from '@/features/home/home.queries';
import { SiteHeader } from '@/components/SiteHeader';
import { ProductGrid } from '@/entities/product';
import { useIsInCart, useToggleCart } from '@/entities/cart';
import { useIsWished, useToggleWish } from '@/entities/wishlist';
import type { Product } from '@/types/commerce';
import '@/examples/week-05-layout/week-05-layout.css';

// 3단계에서 features/add-to-cart·toggle-wishlist로 추출 예정인 임시 조합.
function ProductActions({ product }: { product: Product }) {
  const inCart = useIsInCart(product.id);
  const wished = useIsWished(product.id);
  const toggleCart = useToggleCart();
  const toggleWish = useToggleWish();

  return (
    <>
      <button
        type="button"
        aria-pressed={wished}
        aria-label={`${product.name} 위시리스트`}
        onClick={() => toggleWish(product.id)}
      >
        {wished ? '♥ 찜' : '♡ 찜'}
      </button>
      <button
        type="button"
        aria-pressed={inCart}
        aria-label={`${product.name} 장바구니`}
        onClick={() => toggleCart(product.id)}
      >
        {inCart ? '빼기' : '담기'}
      </button>
    </>
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
      <SiteHeader />

      <section
        className="week05-hero"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.85)), url(${data.banner.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <p>{data.banner.description}</p>
        <h1>{data.banner.title}</h1>
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
          <ProductGrid
            products={data.popularProducts}
            renderActions={(product) => <ProductActions product={product} />}
          />
        )}
      </section>

      <section className="week05-section" aria-label="신상품">
        <h2>신상품</h2>
        {data.newProducts.length === 0 ? (
          <p>신상품이 없어요.</p>
        ) : (
          <ProductGrid
            products={data.newProducts}
            renderActions={(product) => <ProductActions product={product} />}
          />
        )}
      </section>
    </main>
  );
}
