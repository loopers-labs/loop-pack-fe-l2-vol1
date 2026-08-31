'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useSuspenseQuery } from '@tanstack/react-query';
import { productDetailQueryOptions } from '@/entities/product/api/productQueries';
import { useWishlistStore } from '@/entities/wishlist/model/wishlistStore';
import { useCartStore } from '@/entities/cart/model/useCartStore';
import { BackIcon } from '@/shared/ui/icons/BackIcon';
import { StarIcon } from '@/shared/ui/icons/StarIcon';
import { formatWon, calcDiscount } from '@/shared/lib/format';
import { SizeSelect } from './SizeSelect';
import type { SelectOption } from '@/shared/ui/select';
import type { SizeValue } from '@/entities/product/model/types';

const CATEGORY_NAME: Record<string, string> = {
  casual: '캐주얼',
  fashion: '패션',
  goods: '뷰티·잡화',
  home: '홈',
  digital: '디지털',
};

export function ProductDetailContent() {
  const { id } = useParams<{ id: string }>();
  const { data: product } = useSuspenseQuery(productDetailQueryOptions(id));

  const isWished = useWishlistStore((s) => s.ids.has(product.id));
  const toggle = useWishlistStore((s) => s.toggle);
  const addItem = useCartStore((s) => s.addItem);

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
      <div className="sticky top-0 z-20 border-b border-border bg-bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1256px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/products"
            aria-label="상품 목록으로 돌아가기"
            className="flex size-11 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-neutral-100 hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
          >
            <BackIcon />
          </Link>
          <span className="truncate text-[14px] text-text-secondary">
            {product.name}
          </span>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1256px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-16">
          {/* 상품 이미지 */}
          <div className="aspect-square overflow-hidden rounded-lg bg-neutral-100 lg:sticky lg:top-24">
            <img
              src={product.image}
              alt={product.name}
              className="size-full object-contain p-6 sm:p-10"
            />
          </div>

          {/* 상품 정보 */}
          <section aria-labelledby="product-title" className="py-2 lg:py-4">
            {product.freeShipping && (
              <span className="inline-flex border border-neutral-300 px-2 py-1 text-[11px] font-semibold text-text-secondary">
                무료배송
              </span>
            )}

            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-text-caption">
              {product.brand}
            </p>

            <Link
              href={`/products?category=${product.category}`}
              className="mt-2 inline-block rounded-sm text-xs font-medium text-text-caption underline-offset-4 transition-colors hover:text-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text"
            >
              {CATEGORY_NAME[product.category] ?? product.category}
            </Link>

            <h1
              id="product-title"
              className="mt-3 text-3xl font-bold leading-tight tracking-[-0.04em] text-text sm:text-4xl"
            >
              {product.name}
            </h1>

            <div className="mt-8">
              <div className="flex items-baseline gap-2.5">
                {discount > 0 && (
                  <span className="text-2xl font-bold text-discount">
                    {discount}%
                  </span>
                )}
                <span className="text-2xl font-bold tracking-[-0.02em] text-text">
                  {formatWon(product.price)}
                </span>
              </div>
              {product.originalPrice && (
                <p className="mt-1 text-sm text-text-caption line-through">
                  {formatWon(product.originalPrice)}
                </p>
              )}
            </div>

            <div className="mt-5 flex items-center gap-1.5">
              <StarIcon className="size-4 text-amber-500" />
              <span className="text-sm font-semibold text-text">
                {product.rating}
              </span>
              <span className="text-sm text-text-secondary">
                ({product.reviewCount.toLocaleString('ko-KR')}개 리뷰)
              </span>
            </div>

            {sizeItems.length > 0 && (
              <div className="mt-10 border-t border-border pt-8">
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
                  사이즈 선택
                </h2>
                <SizeSelect options={sizeItems} />
              </div>
            )}

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => toggle(product.id)}
                className={`flex min-h-[52px] shrink-0 items-center justify-center rounded-lg border px-6 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text ${
                  isWished
                    ? 'border-text bg-text text-white'
                    : 'border-border text-text-secondary hover:border-neutral-400 hover:text-text'
                }`}
              >
                {isWished ? '찜 해제' : '찜하기'}
              </button>
              <button
                type="button"
                onClick={() => addItem(product.id)}
                className="flex min-h-[52px] flex-1 items-center justify-center rounded-lg bg-text px-6 text-[15px] font-semibold text-white transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
              >
                장바구니 담기
              </button>
            </div>
          </section>
        </div>

        {/* 상품 정보 테이블 */}
        <section className="mt-16 border-t border-border py-10 sm:mt-20 sm:py-12">
          <h2 className="text-xl font-bold tracking-[-0.03em] text-text">
            상품 정보
          </h2>
          <dl className="mt-6 grid border-t border-border sm:grid-cols-2">
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
                className="flex items-center border-b border-border py-4 sm:odd:pr-8 sm:even:pl-8"
              >
                <dt className="w-24 shrink-0 text-sm text-text-caption">
                  {label}
                </dt>
                <dd className="text-sm font-medium text-text">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
    </>
  );
}
