import { PRODUCT_LIST_DEFAULTS } from '@/entities/product/api/productService';
import { ProductListIntro } from './ProductListIntro';

function CardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-square rounded-xl bg-border/40" />
      <div className="mt-2 h-3 w-12 rounded bg-border/40" />
      <div className="mt-1 h-4 w-3/4 rounded bg-border/40" />
      <div className="mt-1 h-4 w-1/3 rounded bg-border/40" />
    </div>
  );
}

export function ProductListSkeleton() {
  return (
    <main className="px-8 py-10">
      <ProductListIntro />
      <div className="mt-6 flex flex-wrap gap-4">
        <div className="h-10 w-48 rounded-lg bg-border/40" />
        <div className="h-10 w-28 rounded-lg bg-border/40" />
        <div className="h-10 w-28 rounded-lg bg-border/40" />
      </div>
      <div className="mt-6 h-5 w-16 rounded bg-border/40" />
      <div className="mt-4 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: PRODUCT_LIST_DEFAULTS.pageSize }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}
