import { Suspense } from 'react';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '../../getQueryClient';
import { productDetailQueryOptions } from '@/entities/product/api/productQueries';
import { ProductDetailContent } from '@/_pages/product-detail/ui/ProductDetailContent';

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params;
  const queryClient = getQueryClient();
  await queryClient.ensureQueryData(productDetailQueryOptions(id));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="size-8 animate-spin rounded-full border-2 border-border border-t-brand" />
              <p className="text-sm text-text-secondary">
                상품 정보를 불러오는 중...
              </p>
            </div>
          </div>
        }
      >
        <ProductDetailContent />
      </Suspense>
    </HydrationBoundary>
  );
}
