"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { buildDefaultProductListQuery } from "@/hooks/productListSearchParams";
import { productQueries } from "@/queries/products";
import type { CategoryId } from "@/types/commerce";

type PrefetchCategoryLinkProps = {
  category: CategoryId | "all";
  href: string;
  className?: string;
  children: ReactNode;
};

export function PrefetchCategoryLink({
  category,
  href,
  className,
  children,
}: PrefetchCategoryLinkProps) {
  const queryClient = useQueryClient();

  // params 를 리터럴로 넣지 않고 파서 default 단일 출처(PRODUCT_LIST_DEFAULTS)에서 파생 →
  // 목록 페이지의 resolveProductListQuery(파싱값)와 같은 queryKey 가 보장
  const warmProductList = () => {
    queryClient.prefetchQuery(
      productQueries.list(buildDefaultProductListQuery({ category })),
    );
  };

  return (
    <Link
      href={href}
      className={className}
      onMouseEnter={warmProductList}
      onFocus={warmProductList}
    >
      {children}
    </Link>
  );
}
