'use client';

import { useQuery } from '@tanstack/react-query';
import { ProductGrid } from '@/entities/product';
import { AddToCartButton } from '@/features/add-to-cart/ui/AddToCartButton';
import { WishButton } from '@/features/toggle-wishlist/ui/WishButton';
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
