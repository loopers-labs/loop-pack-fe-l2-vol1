import { ProductGridSkeleton } from "@/entities/product";
import { HeroSection } from "./hero-section";

export function HomePendingFallback() {
  return (
    <>
      <section className="week05-hero" aria-hidden="true" />
      <HeroSection />
      <section className="week05-section" aria-busy="true" aria-label="홈 불러오는 중">
        <ProductGridSkeleton />
      </section>
    </>
  );
}
