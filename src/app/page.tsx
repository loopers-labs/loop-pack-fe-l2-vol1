import { ProductSection } from "@/components/commerce/ProductSection";
import { SiteHeader } from "@/components/commerce/SiteHeader";
import { CategoryNav } from "@/features/home/CategoryNav";
import { HomeHero } from "@/features/home/HomeHero";
import type { ProductCardItem } from "@/components/commerce/ProductCard";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-6 pb-16">
      <SiteHeader wishlistCount={0} cartCount={0} />
      <HomeHero />
      <CategoryNav />
      <ProductSection title="인기 상품" products={popularProducts} />
      <ProductSection title="신상품" products={newProducts} />
    </main>
  );
}

const popularProducts: ProductCardItem[] = Array.from({ length: 4 }, (_, index) => ({
  id: `popular-${index}`,
  image: "/images/products/p1.jpg",
  imageAlt: "[11월 20일 예약배송] Winter Rocky Pants 2color 윈터 로키팬츠 OG",
  brand: "브랜드",
  name: "[11월 20일 예약배송] Winter Rocky Pants 2color 윈터 로키팬츠 OG",
  priceText: "0원",
}));

const newProducts: ProductCardItem[] = Array.from({ length: 4 }, (_, index) => ({
  id: `new-${index}`,
  image: "/images/products/p6.jpg",
  imageAlt: "WOMAN GNRL 케이블 풀오버 [IVORY] / WBC3L05502",
  brand: "브랜드",
  name: "WOMAN GNRL 케이블 풀오버 [IVORY] / WBC3L05502",
  priceText: "0원",
}));
