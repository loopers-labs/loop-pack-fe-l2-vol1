import { products } from '@/app/api/_data/commerce';
import type { Product } from '@/entities/product';
import type { ApiErrorResponse } from '@/shared/api/types';
import { NextRequest, NextResponse } from 'next/server';

type ProductDetailResponse = { product: Product };

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ProductDetailResponse | ApiErrorResponse>> {
  const { id } = await params;
  const product = products.find((p) => p.id === id);

  if (!product) {
    return NextResponse.json({ message: '상품을 찾을 수 없습니다.' }, { status: 404 });
  }

  return NextResponse.json({ product });
}
