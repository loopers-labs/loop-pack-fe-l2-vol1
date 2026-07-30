type ProductGridSkeletonProps = {
  count?: number;
};

export function ProductGridSkeleton({ count = 10 }: ProductGridSkeletonProps) {
  return (
    <div className="week05-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div className="week05-skeleton-card" key={index}>
          <div className="week05-skeleton week05-skeleton-image" />
          <div className="week05-skeleton week05-skeleton-line" />
          <div className="week05-skeleton week05-skeleton-line is-short" />
          <div className="week05-skeleton week05-skeleton-line is-price" />
        </div>
      ))}
    </div>
  );
}
