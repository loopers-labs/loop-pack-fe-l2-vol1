import { ProductGridSkeleton } from "@/components/commerce/ProductGridSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";

export function ProductListPageSkeleton() {
  return (
    <div aria-label="상품을 불러오는 중입니다.">
      <section className="mt-8">
        <Skeleton className="mb-5 h-10 w-36 rounded-full" />
        <div className="flex flex-wrap items-end gap-3 rounded-gds-lg bg-white p-4 shadow-[inset_0_0_0_1px_var(--color-gds-gray-200)]">
          <Skeleton className="h-11 flex-1 max-md:flex-[1_1_100%]" />
          <Skeleton className="h-11 w-36 max-md:flex-[1_1_100%]" />
          <Skeleton className="h-11 w-36 max-md:flex-[1_1_100%]" />
          <Skeleton className="h-11 w-28" />
        </div>
      </section>

      <section className="mt-8">
        <Skeleton className="mb-4 h-5 w-16 rounded-full" />
        <ProductGridSkeleton />
      </section>
    </div>
  );
}
