"use client";

import { ProductGridSkeleton } from "@/entities/product";
import { CommerceApiError } from "@/shared/api/commerce-client";
import { Placeholder } from "@/shared/ui/placeholder";
import { useQuery } from "@tanstack/react-query";
import { homeQueries } from "../api/queries";
import { HeroSection } from "./hero-section";
import { HomeBanner } from "./home-banner";
import { HomeCategoryLinks } from "./home-category-links";
import { HomeProductSection } from "./home-product-section";

export function HomePage() {
  const { data: home, isLoading, isError, error, refetch } = useQuery(homeQueries.home());

  return (
    <>
      {home === undefined ? (
        <section className="week05-hero" aria-hidden="true" />
      ) : (
        <HomeBanner banner={home.banner} />
      )}
      <HeroSection title={home?.banner.title} description={home?.banner.description} />
      {isLoading ? (
        <section className="week05-section" aria-busy="true" aria-label="홈 불러오는 중">
          <ProductGridSkeleton />
        </section>
      ) : isError ? (
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
      ) : home === undefined ? null : (
        <>
          <HomeCategoryLinks categories={home.categories} />
          <HomeProductSection title="인기 상품" products={home.popularProducts} />
          <HomeProductSection title="신상품" products={home.newProducts} />
        </>
      )}
    </>
  );
}
