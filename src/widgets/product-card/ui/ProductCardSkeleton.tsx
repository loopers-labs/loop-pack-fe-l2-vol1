export function ProductCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="animate-pulse motion-reduce:animate-none"
    >
      <div className="relative aspect-square rounded-lg bg-border/50">
        <div className="absolute bottom-1 right-1 flex flex-col">
          <div className="size-11 rounded-full bg-border" />
          <div className="size-11 rounded-full bg-border" />
        </div>
      </div>
      <div className="min-h-[6.5rem]">
        <div className="mt-3 h-3 w-1/3 rounded bg-border/40" />
        <div className="mt-2 h-4 w-3/4 rounded bg-border/40" />
        <div className="mt-1 h-4 w-1/2 rounded bg-border/40" />
        <div className="mt-2 h-4 w-2/5 rounded bg-border/40" />
        <div className="mt-2 h-3 w-3/5 rounded bg-border/40" />
      </div>
    </div>
  );
}
