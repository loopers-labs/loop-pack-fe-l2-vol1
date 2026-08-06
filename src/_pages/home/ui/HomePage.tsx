'use client';

import { useQuery } from '@tanstack/react-query';
import { ProductGrid } from '@/entities/product';
import { AddToCartButton } from '@/features/add-to-cart/ui/AddToCartButton';
import { WishButton } from '@/features/toggle-wishlist/ui/WishButton';
// 7주차 0단계 Before: 강사 제공 Hero를 최소 연결(원본 7.5MB 이미지 그대로 — 아직 최적화 금지).
// FSD상 최종 위치(_pages/home/ui)로의 이동·최적화는 1단계에서 결정한다.
import { HeroSection } from '@/examples/week-07-performance/HeroSection';
import { homeQueries } from '../api/home.queries';

export function HomePage() {
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
    <main>
      <HeroSection
        title={data.banner.title}
        description={data.banner.description}
      />

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
            renderActions={(product) => (
              <>
                <WishButton productId={product.id} productName={product.name} />
                <AddToCartButton
                  productId={product.id}
                  productName={product.name}
                />
              </>
            )}
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
            renderActions={(product) => (
              <>
                <WishButton productId={product.id} productName={product.name} />
                <AddToCartButton
                  productId={product.id}
                  productName={product.name}
                />
              </>
            )}
          />
        )}
      </section>
    </main>
  );
}
