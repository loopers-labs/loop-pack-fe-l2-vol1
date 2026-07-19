import { Suspense } from "react";
import { ProductListContainer } from "@/features/products/ProductListContainer";

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center">상품을 불러오는 중입니다.</div>}>
      <ProductListContainer />
    </Suspense>
  );
}
