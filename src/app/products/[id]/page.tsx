import type { Metadata } from 'next';
import { Suspense } from 'react';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '../../getQueryClient';
import { productDetailQueryOptions } from '@/entities/product/api/productQueries';
import { getProductById } from '@/entities/product/api/productService';
import { ProductDetailContent } from '@/_pages/product-detail/ui/ProductDetailContent';

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = getProductById(id);

  if (!product) {
    return { title: '상품을 찾을 수 없습니다' };
  }

  const title = `${product.brand} ${product.name}`;
  const formattedPrice = product.price.toLocaleString();
  const description = `${product.name} ${formattedPrice}원 | ${product.brand}의 감각적인 아이템을 Aesthetic에서 만나보세요.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: product.image }],
      siteName: 'Aesthetic',
      locale: 'ko_KR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [product.image],
    },
  };
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
