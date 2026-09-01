import { productDetailQueryOptions } from '@/_pages/product-detail/api/productDetailQueries';
import { ProductDetailPage } from '@/_pages/product-detail/ui/ProductDetailPage';
import { getQueryClient } from '@/shared/api/queryClient';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ id: string }>;
};

/**
 * 상세 metadata.
 *
 * 본문과 같은 query factory 로 조회한다. 홈·목록과 같은 형태다.
 * 조회가 실패하면 페이지별 빈 값을 만들지 않고 빈 객체를 돌려 root 공통 metadata 를 상속한다.
 * 없는 상품이면 본문의 notFound() 가 404 화면을 맡으므로 여기서 따로 처리하지 않는다.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const { product } = await getQueryClient().fetchQuery(productDetailQueryOptions.detail(id));

    return { title: product.name };
  } catch {
    return {};
  }
}

export default async function ProductDetailRoute({ params }: Props) {
  const { id } = await params;
  return <ProductDetailPage id={id} />;
}
