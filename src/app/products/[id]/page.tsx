'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Dialog } from '@/components/ui/dialog';
import { BackIcon } from '@/components/icons/BackIcon';
import { StarIcon } from '@/components/icons/StarIcon';
import { CartIcon } from '@/components/icons/CartIcon';
import { formatWon, calcDiscount } from '@/utils/format';
import { CATEGORY_LABEL } from '@/constants/category';
import { OptionSelect } from './_components/OptionSelect';
import { SizeSelect } from './_components/SizeSelect';
import { ProductDetailResponseSchema } from '@/types/product';
import type { Product } from '@/types/product';
import type { SelectOption } from '@/components/ui/select';

// ── 타입 ──

type OptionValue = { id: string; name: string; price: number; stock: number };
type SizeValue = { value: number; stock: number };

// ── 페이지 ──

export default function ProductDetailPage() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isCartDialogOpen, setIsCartDialogOpen] = useState(false);
  const [selectedOptionName, setSelectedOptionName] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let ignore = false;

    void fetch(`/api/products?id=${params.id}`)
      .then((response) => {
        if (!response.ok) throw new Error('상품을 찾을 수 없습니다.');
        return response.json();
      })
      .then((raw: unknown) => {
        const data = ProductDetailResponseSchema.parse(raw);
        if (!ignore) setProduct(data.product);
      })
      .catch(() => {
        if (!ignore) setIsError(true);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
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
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-text-secondary">
            상품을 찾을 수 없습니다.
          </p>
          <Link
            href="/"
            className="text-[13px] font-medium text-brand transition-colors hover:text-brand/80"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const discount = product.originalPrice
    ? calcDiscount(product.originalPrice, product.price)
    : 0;

  const optionItems: SelectOption<OptionValue>[] = product.options.map((o) => ({
    value: o,
    isDisabled: o.stock === 0,
  }));

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
            href="/"
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
              src={product.imageUrl}
              alt={product.name}
              className="size-full object-contain p-8"
            />
          </div>
        </div>

        {/* 상품 정보 */}
        <div className="bg-bg-card px-6 pb-10 pt-8">
          {/* 배송 뱃지 */}
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-brand-light px-3 py-1 text-[12px] font-medium text-brand">
              {product.deliveryType}
            </span>
            {product.freeShipping && (
              <span className="rounded-full border border-accent/40 px-3 py-1 text-[12px] font-medium text-accent">
                무료배송
              </span>
            )}
          </div>

          {/* 카테고리 */}
          <Link
            href={`/?category=${product.category}`}
            className="mt-4 inline-block rounded-full px-3 py-1 text-[12px] font-medium uppercase tracking-wider text-text-caption transition-colors hover:bg-brand-light hover:text-brand"
          >
            {CATEGORY_LABEL[product.category]}
          </Link>

          {/* 상품명 */}
          <h2 className="mt-2 font-family-display text-2xl font-normal leading-snug text-text">
            {product.name}
          </h2>

          {/* 설명 */}
          <p className="mt-3 text-[14px] leading-relaxed text-text-secondary">
            {product.description}
          </p>

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

          {/* 구매 버튼 */}
          <div className="mt-8 flex gap-3">
            <button
              type="button"
              className="flex size-[52px] shrink-0 items-center justify-center rounded-xl border border-border text-text-secondary transition-colors hover:bg-bg hover:text-text"
              onClick={() => setIsCartDialogOpen(true)}
              aria-label="장바구니 담기"
            >
              <CartIcon />
            </button>
            <button
              type="button"
              className="flex h-[52px] flex-1 items-center justify-center rounded-xl bg-text text-[15px] font-semibold text-bg-card transition-colors hover:bg-text/90"
            >
              구매하기
            </button>
          </div>
        </div>

        {/* 구분 여백 */}
        <div className="h-3 bg-bg" />

        {/* 옵션 선택 영역 */}
        {(optionItems.length > 0 || sizeItems.length > 0) && (
          <div className="bg-bg-card px-6 py-8">
            <h3 className="mb-5 text-[13px] font-semibold uppercase tracking-wider text-text-secondary">
              옵션 선택
            </h3>
            <div className="space-y-3">
              {optionItems.length > 0 && (
                <OptionSelect
                  options={optionItems}
                  isFreeShipping={product.freeShipping}
                  onSelect={(opt) => setSelectedOptionName(opt.value.name)}
                />
              )}
              {sizeItems.length > 0 && <SizeSelect options={sizeItems} />}
            </div>
          </div>
        )}

        {/* 구분 여백 */}
        <div className="h-3 bg-bg" />

        {/* 상품 상세 */}
        <div className="bg-bg-card px-6 py-8">
          <h3 className="mb-5 text-[13px] font-semibold uppercase tracking-wider text-text-secondary">
            상품 상세
          </h3>
          <p className="text-[14px] leading-relaxed text-text">
            {product.description}
          </p>
        </div>

        {/* 구분 여백 */}
        <div className="h-3 bg-bg" />

        {/* 상품 정보 테이블 */}
        <div className="bg-bg-card px-6 py-8">
          <h3 className="mb-5 text-[13px] font-semibold uppercase tracking-wider text-text-secondary">
            상품 정보
          </h3>
          <div className="overflow-hidden rounded-xl border border-border">
            {[
              ['카테고리', CATEGORY_LABEL[product.category]],
              [
                '배송',
                `${product.deliveryType}${product.freeShipping ? ' · 무료배송' : ''}`,
              ],
              [
                '재고 상태',
                product.stock > 0
                  ? `재고 있음 (${product.stock}개)`
                  : '일시 품절',
              ],
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

      {/* 장바구니 Dialog — controlled */}
      <Dialog open={isCartDialogOpen} onOpenChange={setIsCartDialogOpen}>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-text/30 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed inset-0 z-[51] flex items-center justify-center p-6">
          <div
            className="w-full max-w-[340px] rounded-2xl bg-bg-card p-7 shadow-[0_16px_48px_rgba(44,36,32,0.12)]"
            onClick={(e) => e.stopPropagation()}
          >
            <Dialog.Title className="font-family-display text-[18px] font-normal text-text">
              장바구니에 담았습니다
            </Dialog.Title>
            <Dialog.Description className="mt-3 text-[14px] leading-relaxed text-text-secondary">
              {selectedOptionName
                ? `"${selectedOptionName}" 옵션이 장바구니에 추가되었습니다.`
                : '선택한 상품이 장바구니에 추가되었습니다.'}
            </Dialog.Description>
            <div className="mt-7 flex gap-3">
              <Dialog.Close className="flex h-12 flex-1 items-center justify-center rounded-xl border border-border text-[14px] font-medium text-text transition-colors hover:bg-bg">
                계속 쇼핑
              </Dialog.Close>
              <Dialog.Close className="flex h-12 flex-1 items-center justify-center rounded-xl bg-text text-[14px] font-medium text-bg-card transition-colors hover:bg-text/90">
                장바구니 보기
              </Dialog.Close>
            </div>
          </div>
        </Dialog.Content>
      </Dialog>
    </>
  );
}
