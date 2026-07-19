"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { ProductSection } from "@/components/commerce/ProductSection";
import { CategoryNav } from "./CategoryNav";
import { HomeHero } from "./HomeHero";
import { homeQueries } from "./queries/homeQueries";

export function HomePageClient() {
  const { data } = useSuspenseQuery(homeQueries.main());

  return (
    <>
      <HomeHero banner={data.banner} />
      <CategoryNav categories={data.categories} />
      <ProductSection title="인기 상품" products={data.popularProducts} />
      <ProductSection title="신상품" products={data.newProducts} />
    </>
  );
}
