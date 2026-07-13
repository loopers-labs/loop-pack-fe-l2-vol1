"use client";

import { useQuery } from "@tanstack/react-query";
import { ProductSection } from "@/components/commerce/ProductSection";
import { CategoryNav } from "./CategoryNav";
import { HomeHero } from "./HomeHero";
import { homeQueries } from "./queries/homeQueries";

export function HomePageClient() {
  const { data, error, isError, isPending, refetch } = useQuery(homeQueries.main());

  if (isPending) {
    return <div className="py-20 text-center">홈 데이터를 불러오는 중...</div>;
  }

  if (isError) {
    return (
      <div className="py-20 text-center">
        <p>{error instanceof Error ? error.message : "홈 데이터를 불러오지 못했습니다."}</p>
        <button
          className="mt-4 border border-[#c8c8c8] bg-transparent px-3 py-2 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#2557a7]"
          type="button"
          onClick={() => void refetch()}
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <>
      <HomeHero banner={data.banner} />
      <CategoryNav categories={data.categories} />
      <ProductSection title="인기 상품" products={data.popularProducts} />
      <ProductSection title="신상품" products={data.newProducts} />
    </>
  );
}
