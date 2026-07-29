'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { productDetailQueryOptions } from '@/queries/productQueries';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { BackIcon } from '@/components/icons/BackIcon';
import { StarIcon } from '@/components/icons/StarIcon';
import { formatWon, calcDiscount } from '@/utils/format';
import { SizeSelect } from './SizeSelect';
import type { SelectOption } from '@/components/ui/select';
import type { SizeValue } from '@/types/commerce';

const CATEGORY_NAME: Record<string, string> = {
  casual: '캐주얼',
  fashion: '패션',
  goods: '뷰티·잡화',
  home: '홈',
  digital: '디지털',
};

export function ProductDetailContent() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading, isError, error } = useQuery(
    productDetailQueryOptions(id),
  );

  const isWished = useWishlistStore((s) =>
    product ? s.ids.has(product.id) : false,
  );
  const toggle = useWishlistStore((s) => s.toggle);
  const addItem = useCartStore((s) => s.addItem);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-border border-t-brand" />
          <p className="text-sm text-text-secondary">
            상품 정보를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-text-secondary">
            {error?.message ?? '상품을 찾을 수 없습니다.'}
          </p>
          <Link
            href="/products"
            className="text-[13px] font-medium text-brand transition-colors hover:text-brand/80"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const discount = product.originalPrice
    ? calcDiscount(product.originalPrice, product.price)
    : 0;

  const sizeItems: SelectOption<SizeValue>[] = product.sizes.map((s) => ({
    value: s,
    isDisabled: s.stock === 0,
  }));

  return (
    <>
      {/* 서브 네비게이션 */}
      <div className="sticky top-0 z-20 border-b border-border/40 bg-bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-3">
          <Link
            href="/products"
            className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-bg hover:text-text"
          >
            <BackIcon />
          </Link>
          <span className="truncate text-[14px] text-text-secondary">
            {product.name}
          </span>
        </div>
      </div>

      <main className="mx-auto max-w-3xl">
        {/* 상품 이미지 */}
        <div className="bg-bg-card">
          <div className="mx-auto aspect-square max-w-lg overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="size-full object-contain p-8"
            />
          </div>
        </div>

        {/* 상품 정보 */}
        <div className="bg-bg-card px-6 pb-10 pt-8">
          {/* 배송 뱃지 */}
          {product.freeShipping && (
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-accent/40 px-3 py-1 text-[12px] font-medium text-accent">
                무료배송
              </span>
            </div>
          )}

          {/* 브랜드 */}
          <p className="mt-4 text-[12px] font-medium uppercase tracking-wider text-text-caption">
            {product.brand}
          </p>

          {/* 카테고리 */}
          <Link
            href={`/products?category=${product.category}`}
            className="mt-2 inline-block rounded-full px-3 py-1 text-[12px] font-medium text-text-caption transition-colors hover:bg-brand-light hover:text-brand"
          >
            {CATEGORY_NAME[product.category] ?? product.category}
          </Link>

          {/* 상품명 */}
          <h2 className="mt-2 font-family-display text-2xl font-normal leading-snug text-text">
            {product.name}
          </h2>

          {/* 가격 */}
          <div className="mt-6">
            <div className="flex items-baseline gap-2.5">
              {discount > 0 && (
                <span className="text-2xl font-bold text-discount">
                  {discount}%
                </span>
              )}
              <span className="text-2xl font-bold text-text">
                {formatWon(product.price)}
              </span>
            </div>
            {product.originalPrice && (
              <p className="mt-1 text-[13px] text-text-caption line-through">
                {formatWon(product.originalPrice)}
              </p>
            )}
          </div>

          {/* 리뷰 */}
          <div className="mt-4 flex items-center gap-1.5">
            <StarIcon className="size-4 text-amber-500" />
            <span className="text-[13px] font-semibold text-text">
              {product.rating}
            </span>
            <span className="text-[13px] text-text-secondary">
              ({product.reviewCount.toLocaleString('ko-KR')}개 리뷰)
            </span>
          </div>

          {/* 찜 · 담기 버튼 */}
          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={() => toggle(product.id)}
              className={`flex h-[52px] shrink-0 items-center justify-center rounded-xl border px-6 text-[14px] font-medium transition-colors ${
                isWished
                  ? 'border-accent text-accent'
                  : 'border-border text-text-secondary hover:bg-bg hover:text-text'
              }`}
            >
              {isWished ? '찜 해제' : '찜하기'}
            </button>
            <button
              type="button"
              onClick={() => addItem(product.id)}
              className="flex h-[52px] flex-1 items-center justify-center rounded-xl bg-text text-[15px] font-semibold text-bg-card transition-colors hover:bg-text/90"
            >
              장바구니 담기
            </button>
          </div>
        </div>

        {/* 사이즈 선택 */}
        {sizeItems.length > 0 && (
          <>
            <div className="h-3 bg-bg" />
            <div className="bg-bg-card px-6 py-8">
              <h3 className="mb-5 text-[13px] font-semibold uppercase tracking-wider text-text-secondary">
                사이즈 선택
              </h3>
              <SizeSelect options={sizeItems} />
            </div>
          </>
        )}

        {/* 상품 정보 테이블 */}
        <div className="h-3 bg-bg" />
        <div className="bg-bg-card px-6 py-8">
          <h3 className="mb-5 text-[13px] font-semibold uppercase tracking-wider text-text-secondary">
            상품 정보
          </h3>
          <div className="overflow-hidden rounded-xl border border-border">
            {[
              ['브랜드', product.brand],
              [
                '카테고리',
                CATEGORY_NAME[product.category] ?? product.category,
              ],
              ['배송', product.freeShipping ? '무료배송' : '유료배송'],
              [
                '등록일',
                new Date(product.createdAt).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }),
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center border-t border-border/50 px-5 py-4 first:border-t-0"
              >
                <dt className="w-24 shrink-0 text-[13px] text-text-caption">
                  {label}
                </dt>
                <dd className="text-[13px] text-text">{value}</dd>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
