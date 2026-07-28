import { ProductGridSkeleton } from "@/components/commerce/ProductGridSkeleton";
import { Skeleton } from "@/shared/ui/Skeleton";

export function HomeLoading() {
  return (
    <div className="grid gap-12" aria-label="홈 데이터를 불러오는 중입니다.">
      <Skeleton className="min-h-[260px] rounded-gds-lg shadow-[inset_0_0_0_1px_var(--color-gds-gray-200)] max-[480px]:min-h-[200px]" />
      <section>
        <Skeleton className="mb-4 h-7 w-24 rounded-full" />
        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton className="h-9 w-20 rounded-full" key={index} />
          ))}
        </div>
      </section>
      <LoadingProductSection />
      <LoadingProductSection />
    </div>
  );
}

function LoadingProductSection() {
  return (
    <section>
      <Skeleton className="mb-4 h-7 w-28 rounded-full" />
      <ProductGridSkeleton count={5} />
    </section>
  );
}
