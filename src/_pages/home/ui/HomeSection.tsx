// AI 생성: 데이터 연동은 ProductListSection.tsx와 같은 방식으로 페이지 섹션 컴포넌트에 구현한다
// (페이지/컴포넌트/API 분리 원칙). 레이아웃 클래스는 commerce.css를 공유한다.
'use client';

import Link from 'next/link';
import { useSuspenseQuery } from '@tanstack/react-query';
import { homeQueries } from '@/_pages/home/api/homeQueries';
import { HeroSection } from '@/_pages/home/ui/HeroSection';
import { ProductCardWithActions } from '@/widgets/product-card';
import type { Product } from '@/entities/product';

interface ProductGridSectionProps {
  title: string;
  products: Product[];
}

function ProductGridSection({ title, products }: ProductGridSectionProps) {
  if (products.length === 0) {
    // AI 생성: 빈 결과 안내 문구. ProductListSection의 빈 결과 처리와 같은 패턴.
    return (
      <section className="content-section">
        <h2>{title}</h2>
        <p>표시할 상품이 없습니다.</p>
      </section>
    );
  }

  return (
    <section className="content-section">
      <h2>{title}</h2>
      <div className="product-grid">
        {products.map((product) => (
          <ProductCardWithActions key={product.id} product={product} headingLevel="h3" />
        ))}
      </div>
    </section>
  );
}

export default function HomeSection() {
  const { data: home } = useSuspenseQuery(homeQueries.detail());

  return (
    <>
      {/* AI 생성: 7주차 측정용 HeroSection이 같은 banner.title·description을 렌더하므로,
          문구가 중복되지 않도록 기존 home-hero 배너를 그대로 대체한다. 이미지 최적화와
          렌더링 경계 조정은 Before 측정 뒤 1단계에서 다룬다. */}
      <HeroSection title={home.banner.title} description={home.banner.description} />
      <section className="content-section">
        <h2>카테고리</h2>
        <div className="category-links">
          {home.categories.map((category) => (
            <Link key={category.id} href={`/products?category=${category.id}`}>
              {category.name}
            </Link>
          ))}
        </div>
      </section>
      <ProductGridSection title="인기 상품" products={home.popularProducts} />
      <ProductGridSection title="신상품" products={home.newProducts} />
    </>
  );
}
