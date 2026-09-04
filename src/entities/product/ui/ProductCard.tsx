'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import { formatPrice } from '@/shared/lib/formatPrice';
import { trackClientError } from '@/analytics/events';
import type { Product } from '../model/types';

interface ProductCardProps {
  product: Product;
  headingLevel: 'h2' | 'h3';
  actions?: ReactNode;
}

// AI 생성: 상품명 헤딩 레벨은 카드를 담는 섹션의 제목 위계에 따라 달라진다(홈은 h2 섹션 제목 아래
// h3, 목록은 h1 페이지 제목 아래 h2). 카드 자체의 관심사가 아니라 소비 컨텍스트의 관심사라 prop으로 받는다.
export default function ProductCard({ product, headingLevel: Heading, actions }: ProductCardProps) {
  return (
    <article className="product-card">
      <Image className="product-card-image" src={product.image} alt={product.name} width={400} height={400} onError={() => trackClientError({ code: 'IMAGE_LOAD_FAILED', productId: product.id })} />
      <p>{product.brand}</p>
      <Heading>{product.name}</Heading>
      <strong>{formatPrice(product.price)}</strong>
      {actions}
    </article>
  );
}
