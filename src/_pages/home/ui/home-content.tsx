"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { homeQueries } from "../api/queries";
import { HeroSection } from "./hero-section";
import { HomeBanner } from "./home-banner";
import { HomeCategoryLinks } from "./home-category-links";
import { HomeProductSection } from "./home-product-section";

export function HomeContent() {
  const { data: home } = useSuspenseQuery(homeQueries.home());

  return (
    <>
      <HomeBanner banner={home.banner} />
      <HeroSection title={home.banner.title} description={home.banner.description} />
      <HomeCategoryLinks categories={home.categories} />
      <HomeProductSection title="인기 상품" products={home.popularProducts} />
      <HomeProductSection title="신상품" products={home.newProducts} />
    </>
  );
}
