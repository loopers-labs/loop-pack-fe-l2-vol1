import { PRODUCT_LIST_DEFAULTS } from '@/entities/product/model/constants';
import { ProductListIntro } from './ProductListIntro';

function CardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-square rounded-lg bg-border/50" />
      <div className="min-h-[6.5rem]">
        <div className="mt-2 h-3 w-12 rounded bg-border/40" />
        <div className="mt-1 h-4 w-3/4 rounded bg-border/40" />
        <div className="mt-1 h-4 w-1/3 rounded bg-border/40" />
      </div>
      <div className="mt-2 flex gap-2">
        <div className="h-7 w-12 rounded-lg bg-border/40" />
        <div className="h-7 w-12 rounded-lg bg-border/40" />
      </div>
    </div>
  );
}

export function ProductListSkeleton() {
  return (
    <main className="min-h-screen px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
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
          <CardSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}
