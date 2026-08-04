import { ProductGridSkeleton } from "@/entities/product";
import { Suspense } from "react";
import { ProductListContent } from "./product-list-content";

export function ProductListPage() {
  return (
    <Suspense
      fallback={
        <section className="week05-section" aria-busy="true" aria-label="상품 목록 불러오는 중">
          <ProductGridSkeleton />
        </section>
      }
    >
      <ProductListContent />
    </Suspense>
  );
}
