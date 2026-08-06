"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@/entities/product";
import { Hero } from "@/widgets/hero";
import { ProductCardWithActions } from "@/widgets/product-card";
import { homeQueryOptions } from "../api/homeQuery";

function ProductSection({ title, products }: { title: string; products: Product[] }) {
  return (
    <section className="shop-section">
      <h2>{title}</h2>
      {products.length === 0 ? (
        <p className="shop-empty">표시할 상품이 없습니다.</p>
      ) : (
        <div className="shop-grid">
          {products.map((product) => (
            <ProductCardWithActions key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}

export function HomePage() {
  const homeQuery = useQuery(homeQueryOptions());

  if (homeQuery.status === "pending") {
    return (
      <main className="shop-page">
        <p className="shop-state">홈을 불러오는 중입니다…</p>
      </main>
    );
  }

  // 에러도 빈 상태와 같은 범위로 다룬다 — 실패한 건 상품 조회지 화면 전체가 아니다.
  // 이전에는 early return이라 배너·카테고리까지 사라져, 사용자가 할 수 있는 게 새로고침뿐이었다.
  if (homeQuery.status === "error") {
    return (
      <main className="shop-page">
        <section className="shop-section" role="alert">
          <h2>상품을 불러오지 못했습니다</h2>
          <p className="shop-state">잠시 후 다시 시도해 주세요.</p>
          <button type="button" onClick={() => void homeQuery.refetch()}>
            다시 시도
          </button>
        </section>
      </main>
    );
  }

  const home = homeQuery.data;

  return (
    <main className="shop-page">
      <section className="shop-hero">
        <p>{home.banner.description}</p>
        <h1>{home.banner.title}</h1>
      </section>
      {/* 배너 문구가 위 h1과 겹치는 것은 렌더링 경계를 정할 때 함께 정리한다. */}
      <Hero title={home.banner.title} description={home.banner.description} />
      <section className="shop-section">
        <h2>카테고리</h2>
        <div className="shop-categories">
          {home.categories.map((category) => (
            <Link key={category.id} href={`/products?category=${category.id}`}>
              {category.name}
            </Link>
          ))}
        </div>
      </section>
      {/* 빈 상태는 상품 섹션 안에서 구분한다(배너·카테고리는 그대로 노출). */}
      <ProductSection title="인기 상품" products={home.popularProducts} />
      <ProductSection title="신상품" products={home.newProducts} />
    </main>
  );
}
