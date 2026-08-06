import type { HTMLAttributes } from "react";

type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={["animate-pulse rounded-gds-sm bg-gds-gray-200", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
