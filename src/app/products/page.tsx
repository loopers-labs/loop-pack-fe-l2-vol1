import { ProductCardItem } from "@/components/commerce/ProductCard";
import { ProductGrid } from "@/components/commerce/ProductGrid";
import { SiteHeader } from "@/components/commerce/SiteHeader";
import { Pagination } from "@/features/products/Pagination";
import { ProductFilters } from "@/features/products/ProductFilters";
import { ProductResultSummary } from "@/features/products/ProductResultSummary";

export default function ProductsPage() {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-6 pb-16">
      <SiteHeader wishlistCount={0} cartCount={0} />
      <section className="mt-10">
        <h1 className="mb-4">상품 목록</h1>
        <ProductFilters />
      </section>
      <section className="mt-10" aria-label="상품 검색 결과">
        <ProductResultSummary totalCount={0} />
        <ProductGrid products={products} />
        <Pagination currentPage={1} totalPages={1} />
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
