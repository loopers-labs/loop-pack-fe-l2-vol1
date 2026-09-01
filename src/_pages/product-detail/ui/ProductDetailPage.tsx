import { AddToCartButton } from '@/features/add-to-cart';
import { WishlistToggleButton } from '@/features/toggle-wishlist';
import { HttpError } from '@/shared/api/httpError';
import { getQueryClient } from '@/shared/api/queryClient';
import Image from 'next/image';
import { notFound } from 'next/navigation';

import { productDetailQueryOptions } from '../api/productDetailQueries';
import type { ProductDetailResponse } from '../model/types';
import { ProductDetailViewTracker } from './ProductDetailViewTracker';

/**
 * 상품 상세.
 *
 * 홈·목록과 달리 Boundary 를 두지 않는다. 이 화면만 서버 컴포넌트인 이유가 둘 있다.
 *
 * 1. 없는 id 는 에러가 아니라 404 다. 클라이언트 쿼리로 옮기면 HttpError(404) 가 ErrorBoundary 로
 *    흘러 "불러오지 못했습니다 · 다시 시도" 가 뜨는데, 없는 상품에 재시도 버튼은 줄 것이 없다.
 *    notFound() 로 Next 의 404 경로에 태우는 편이 맞다.
 * 2. 조회 조건이 라우트 파라미터 하나로 고정이고, 이 화면에는 조건을 바꾸는 조작이 없다.
 *    클라이언트가 다시 조회할 일이 없으니 캐시를 HydrationBoundary 로 넘길 이유도 없다.
 *
 * 다만 query factory 는 둔다. 조회하는 곳이 본문과 generateMetadata 둘이라 경로가 두 곳에
 * 적히면 안 되기 때문이다 — 홈·목록이 metadata 와 본문에서 같은 팩토리를 쓰는 것과 같은 형태다.
 *
 * 담기·찜은 사용자 조작이라 features 의 클라이언트 컴포넌트가 맡는다. 서버 컴포넌트 안에
 * 그대로 꽂아도 각자 'use client' 경계를 갖는다.
 */
type ProductDetailPageProps = {
  id: string;
};

export async function ProductDetailPage({ id }: ProductDetailPageProps) {
  const { product } = await fetchProductOrNotFound(id);

  return (
    <section className="week05-section">
      <ProductDetailViewTracker productId={product.id} />

      <article className="week05-product">
        <Image
          className="week05-image"
          src={product.image}
          alt={product.name}
          width={480}
          height={480}
          sizes="(max-width: 720px) 100vw, 480px"
          priority
        />

        <p>{product.brand}</p>
        <h1>{product.name}</h1>

        <strong>
          {product.price.toLocaleString('ko-KR')}원
          {product.originalPrice !== null && (
            <s style={{ marginLeft: 8, color: '#8794a3', fontWeight: 400 }}>
              {product.originalPrice.toLocaleString('ko-KR')}원
            </s>
          )}
        </strong>

        <p>
          평점 {product.rating} · 리뷰 {product.reviewCount}개
        </p>
        {product.freeShipping && <p>무료 배송</p>}

        <div>
          <WishlistToggleButton productId={product.id} productName={product.name} />
          <AddToCartButton productId={product.id} productName={product.name} />
        </div>
      </article>
    </section>
  );
}

/**
 * 404 만 notFound() 로 보내고 나머지 실패는 그대로 던진다.
 * 전부 삼켜서 404 로 만들면 서버가 5xx 를 낼 때도 "없는 상품"으로 보여 원인을 잃는다.
 */
async function fetchProductOrNotFound(id: string): Promise<ProductDetailResponse> {
  try {
    return await getQueryClient().fetchQuery(productDetailQueryOptions.detail(id));
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}
