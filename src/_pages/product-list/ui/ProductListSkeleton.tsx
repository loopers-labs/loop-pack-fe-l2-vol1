import { PRODUCT_LIST_DEFAULTS } from '@/entities/product/model/constants';
import { ProductCardSkeleton } from '@/widgets/product-card/ui/ProductCardSkeleton';
import { ProductListIntro } from './ProductListIntro';

export function ProductListSkeleton() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[1256px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <ProductListIntro />
      <p role="status" className="sr-only">
        상품을 불러오는 중입니다.
      </p>
      <div className="mt-8 flex flex-wrap gap-3 border-y border-border py-5">
        <div className="h-10 w-48 rounded-lg bg-border/40" />
        <div className="h-10 w-28 rounded-lg bg-border/40" />
        <div className="h-10 w-28 rounded-lg bg-border/40" />
      </div>
      <div className="mt-6 h-5 w-16 rounded bg-border/40" />
      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">
        {Array.from({ length: PRODUCT_LIST_DEFAULTS.pageSize }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}
