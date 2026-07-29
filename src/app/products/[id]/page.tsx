import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import { getQueryClient } from '../../getQueryClient';
import { productDetailQueryOptions } from '@/queries/productQueries';
import { getProductById } from '@/app/api/_data/productService';
import { ProductDetailContent } from './_components/ProductDetailContent';

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params;
  const product = getProductById(id);

  if (!product) {
    notFound();
  }

  const queryClient = getQueryClient();
  queryClient.setQueryData(productDetailQueryOptions(id).queryKey, product);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductDetailContent />
    </HydrationBoundary>
  );
}
