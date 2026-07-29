"use client";

import { HomeBanner } from "@/app/_components/home-banner";
import { HomeCategoryLinks } from "@/app/_components/home-category-links";
import { HomeProductSection } from "@/app/_components/home-product-section";
import { Placeholder } from "@/app/_components/placeholder";
import { ProductGridSkeleton } from "@/app/_components/product-grid-skeleton";
import { commerceQueries } from "@/queries/commerce";
import { CommerceApiError } from "@/services/commerce";
import { useQuery } from "@tanstack/react-query";

export default function HomePage() {
  const { data: home, isLoading, isError, error, refetch } = useQuery(commerceQueries.home());

  if (isLoading) {
    return (
      <section className="week05-section" aria-busy="true" aria-label="홈 불러오는 중">
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

  return (
    <>
      <HomeBanner banner={home.banner} />
      <HomeCategoryLinks categories={home.categories} />
      <HomeProductSection title="인기 상품" products={home.popularProducts} />
      <HomeProductSection title="신상품" products={home.newProducts} />
    </>
  );
}
