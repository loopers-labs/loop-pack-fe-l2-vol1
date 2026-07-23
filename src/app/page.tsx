"use client";

import { Placeholder } from "@/app/_components/placeholder";
import { ProductGridSkeleton } from "@/app/_components/product-grid-skeleton";
import { CartButton, WishlistButton } from "@/app/_components/product-actions";
import { commerceQueries } from "@/queries/commerce";
import { CommerceApiError } from "@/services/commerce";
import type { Product } from "@/types/commerce";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  const { data: home, isLoading, isError, error, refetch } = useQuery(commerceQueries.home());

  if (isLoading) {
    return (
      <section className="week05-section" aria-busy="true" aria-label="상품 목록 불러오는 중">
        <ProductGridSkeleton />
      </section>
    );
  }

  if (isError) {
    return (
      <Placeholder
        role="alert"
        title="상품을 불러오지 못했어요"
        description={
          error instanceof CommerceApiError ? error.message : "잠시 후 다시 시도해 주세요."
        }
        action={
          <button type="button" onClick={() => refetch()}>
            다시 시도
          </button>
        }
      />
    );
  }

  if (home === undefined) {
    return null;
  }

  const sections: Array<{ title: string; products: Product[] }> = [
    { title: "인기 상품", products: home.popularProducts },
    { title: "신상품", products: home.newProducts },
  ];

  return (
    <>
      <section className="week05-hero">
        <p>{home.banner.description}</p>
        <h1>{home.banner.title}</h1>
      </section>
      <section className="week05-section">
        <h2>카테고리</h2>
        <div className="week05-categories">
          {home.categories.map((category) => (
            <Link key={category.id} href={`/products?category=${category.id}`}>
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      {sections.map(({ title, products }) => (
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
                  <WishlistButton productId={product.id} label={product.name} />
                  <CartButton productId={product.id} label={product.name} />
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
