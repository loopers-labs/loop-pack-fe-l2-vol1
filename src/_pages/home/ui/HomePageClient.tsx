"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { ProductSection } from "@/widgets/product-card";
import { CategoryNav } from "./CategoryNav";
import { HeroSection } from "./HeroSection";
import { homeQueries } from "../queries/homeQueries";

export function HomePageClient() {
  const { data } = useSuspenseQuery(homeQueries.main());

  return (
    <>
      <HeroSection title={data.banner.title} description={data.banner.description} />
      <CategoryNav categories={data.categories} />
      <ProductSection title="인기 상품" products={data.popularProducts} />
      <ProductSection title="신상품" products={data.newProducts} />
    </>
  );
}
