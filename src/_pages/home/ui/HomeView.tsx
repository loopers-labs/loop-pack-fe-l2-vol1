"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { homeQueryOptions } from "@/_pages/home/api/queries";
import { ProductSection } from "@/_pages/home/ui/ProductSection";
// Week 7 홈 LCP인 Hero. 원본을 next/image로 표시폭에 맞춰 최적화한다.
// 제공 픽스처라 examples에 두고 여기서 조합만 한다.
import { HeroSection } from "@/examples/week-07-performance/HeroSection";

import { HomeSkeleton } from "./HomeSkeleton";

export function HomeView() {
  const { data, isLoading, isError, error } = useQuery(homeQueryOptions());

  return (
    <>
      {isLoading && <HomeSkeleton />}

      {isError && (
        <section className="week05-section">
          <p role="alert">{error?.message}</p>
        </section>
      )}

      {data && (
        <>
          <HeroSection title={data.banner.title} description={data.banner.description} />
          <section className="week05-section">
            <h2>카테고리</h2>
            <div className="week05-categories">
              {data.categories.map((category) => (
                <Link key={category.id} href={`/products?category=${category.id}`}>
                  {category.name}
                </Link>
              ))}
            </div>
          </section>
          <ProductSection title="인기 상품" products={data.popularProducts} />
          <ProductSection title="신상품" products={data.newProducts} />
        </>
      )}
    </>
  );
}
