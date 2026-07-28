import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '../../getQueryClient';
import { productDetailQueryOptions } from '@/queries/productQueries';
import { ProductDetailContent } from './_components/ProductDetailContent';

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params;
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(productDetailQueryOptions(id));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductDetailContent />
    </HydrationBoundary>
  );
}
