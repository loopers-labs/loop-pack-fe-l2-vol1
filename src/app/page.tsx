"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@/entities/product/model/types";
import { homeQueryOptions } from "@/features/commerce/queries";
import { ProductCardWithActions } from "@/widgets/product-card/ui/ProductCardWithActions";

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

export default function HomePage() {
  const homeQuery = useQuery(homeQueryOptions());

  // 로딩·에러·데이터를 구분해서 그린다(성공 경로만 그리지 않는다).
  if (homeQuery.status === "pending") {
    return (
      <main className="shop-page">
        <p className="shop-state">홈을 불러오는 중입니다…</p>
      </main>
    );
  }

  if (homeQuery.status === "error") {
    return (
      <main className="shop-page">
        <p className="shop-state" role="alert">
          홈 데이터를 불러오지 못했습니다.
        </p>
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
