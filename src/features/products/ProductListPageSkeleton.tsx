import { ProductGridSkeleton } from "@/components/commerce/ProductGridSkeleton";
import { Skeleton } from "@/shared/ui/Skeleton";
import { PRODUCT_LIST_PAGE_SIZE } from "./constants";

export function ProductListPageSkeleton() {
  return (
    <div aria-label="상품을 불러오는 중입니다.">
      <section className="mt-8">
        <Skeleton className="mb-5 h-10 w-36 rounded-full" />
        <div className="flex flex-wrap items-end gap-3 rounded-gds-lg bg-white p-4 shadow-[inset_0_0_0_1px_var(--color-gds-gray-200)]">
          <div className="grid flex-1 gap-1.5 max-md:flex-[1_1_100%]">
            <Skeleton className="h-5 w-10 rounded-full" />
            <Skeleton className="h-11 w-full" />
          </div>
          <div className="grid gap-1.5 max-md:flex-[1_1_100%]">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-11 w-36 max-md:w-full" />
          </div>
          <div className="grid gap-1.5 max-md:flex-[1_1_100%]">
            <Skeleton className="h-5 w-8 rounded-full" />
            <Skeleton className="h-11 w-36 max-md:w-full" />
          </div>
          <div className="grid gap-1.5">
            <span className="h-5" aria-hidden />
            <Skeleton className="h-11 w-28" />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <Skeleton className="mb-4 h-5 w-16 rounded-full" />
        <ProductGridSkeleton count={PRODUCT_LIST_PAGE_SIZE} />
      </section>
    </div>
  );
}
