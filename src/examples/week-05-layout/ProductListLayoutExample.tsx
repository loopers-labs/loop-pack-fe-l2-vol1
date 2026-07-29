import { ProductGrid } from "@/components/commerce/ProductGrid";
import { CommerceHeader } from "@/components/commerce/CommerceHeader";
import type { ProductCardItem } from "@/entities/product";
import { Pagination } from "@/features/products/Pagination";
import { ProductFilters } from "@/features/products/ProductFilters";
import { ProductResultSummary } from "@/features/products/ProductResultSummary";

/**
 * 5주차 과제를 빠르게 시작할 수 있도록 제공하는 최소 레이아웃 예시입니다.
 * 이 구조는 상태관리 아키텍처의 정답이 아닙니다.
 * 그대로 사용하거나, 기존 컴포넌트를 재사용하거나, 자유롭게 교체해도 됩니다.
 * 데이터 조회, Query 구성, 전역 상태와 이벤트 연결은 포함되어 있지 않습니다.
 * 실제 상태를 연결할 때 각 버튼의 aria-pressed를 해당 상품의 포함 여부로 바꿉니다.
 */
export function ProductListLayoutExample() {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-6 pb-16">
      <CommerceHeader />
      <section className="mt-10">
        <h1 className="mb-4">상품 목록</h1>
        <ProductFilters
          q=""
          category="all"
          sort="latest"
          onSearchChange={() => {}}
          onCategoryChange={() => {}}
          onSortChange={() => {}}
          onReset={() => {}}
        />
      </section>
      <section className="mt-10" aria-label="상품 검색 결과">
        <ProductResultSummary totalCount={0} />
        <ProductGrid products={products} />
        <Pagination currentPage={1} totalPages={1} onPageChange={() => {}} />
      </section>
    </main>
  );
}

const products: ProductCardItem[] = Array.from({ length: 8 }, (_, index) => {
  const isGoodsProduct = index % 2 === 0;

  return {
    id: `product-${index}`,
    image: isGoodsProduct ? "/images/products/p11.jpg" : "/images/products/p16.jpg",
    imageAlt: isGoodsProduct
      ? "하이드레이팅 나이트 립 마스크 25g + 소프트 글로우 결 토너 210ml"
      : "스탠리 클래식 런치박스",
    brand: "브랜드",
    name: isGoodsProduct
      ? "하이드레이팅 나이트 립 마스크 25g + 소프트 글로우 결 토너 210ml"
      : "스탠리 클래식 런치박스",
    priceText: "0원",
  };
});
