import { Skeleton } from "@/components/ui/Skeleton";

type ProductGridSkeletonProps = {
  count?: number;
};

export function ProductGridSkeleton({ count = 10 }: ProductGridSkeletonProps) {
  return (
    <div
      className="grid grid-cols-2 gap-x-3 gap-y-7 md:grid-cols-3 lg:grid-cols-5 lg:gap-x-5 lg:gap-y-8"
      aria-hidden
    >
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <article className="grid gap-2.5">
      <Skeleton className="aspect-square rounded-gds-md" />
      <Skeleton className="h-4 w-20 rounded-full" />
      <div className="grid min-h-[3.25rem] content-start gap-2">
        <Skeleton className="h-4 w-full rounded-full" />
        <Skeleton className="h-4 w-4/5 rounded-full" />
      </div>
      <Skeleton className="h-6 w-24 rounded-full" />
      <Skeleton className="h-8 w-full" />
    </article>
  );
}
