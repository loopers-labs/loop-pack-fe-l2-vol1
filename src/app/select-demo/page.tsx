'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { formatWon } from '@/utils/format';
import { TextOptionSelect } from './_components/TextOptionSelect';
import { SizeOptionSelect } from './_components/SizeOptionSelect';
import { ThumbnailOptionSelect } from './_components/ThumbnailOptionSelect';
import { ProductListResponseSchema } from '@/types/product';
import type { Product } from '@/types/product';
import type { SelectOption } from '@/components/ui/select';

// ── 타입 ──

type OptionValue = { id: string; name: string; price: number; stock: number };
type SizeValue = { value: number; stock: number };

// ── 페이지 ──

export default function SelectDemoPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedText, setSelectedText] =
    useState<SelectOption<OptionValue> | null>(null);
  const [selectedSize, setSelectedSize] =
    useState<SelectOption<SizeValue> | null>(null);
  const [selectedThumb, setSelectedThumb] =
    useState<SelectOption<Product> | null>(null);

  useEffect(() => {
    let ignore = false;

    void fetch('/api/products')
      .then((r) => r.json())
      .then((raw: unknown) => {
        const data = ProductListResponseSchema.parse(raw);
        if (!ignore) setProducts(data.products);
      });

    return () => {
      ignore = true;
    };
  }, []);

  if (products.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-border border-t-brand" />
          <p className="text-sm text-text-secondary">로딩 중...</p>
        </div>
      </div>
    );
  }

  const product = products[0];

  const optionItems: SelectOption<OptionValue>[] = product.options.map((o) => ({
    value: o,
    isDisabled: o.stock === 0,
  }));

  const sizeSource =
    product.sizes.length > 0
      ? product.sizes
      : (products.find((p) => p.sizes.length > 0)?.sizes ?? []);

  const sizeItems: SelectOption<SizeValue>[] = sizeSource.map((s) => ({
    value: s,
    isDisabled: s.stock === 0,
  }));

  const thumbnailItems: SelectOption<Product>[] = products
    .slice(0, 5)
    .map((p) => ({ value: p }));

  return (
    <>
      {/* 페이지 타이틀 */}
      <div className="bg-bg-card">
        <div className="mx-auto max-w-xl px-6 py-6">
          <h1 className="font-family-display text-lg font-normal text-text">
            Select 3종 데모
          </h1>
          <p className="mt-1.5 text-[13px] text-text-secondary">
            같은{' '}
            <code className="rounded-md bg-bg px-2 py-0.5 text-[12px] font-medium text-brand">
              useSelect
            </code>{' '}
            훅으로 3가지 UI를 구성합니다.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-xl px-6 py-8">
        {/* Select 섹션들 */}
        <section className="rounded-2xl bg-bg-card p-6">
          <div className="mb-5">
            <h2 className="text-[13px] font-semibold text-text">
              1. 텍스트 옵션
            </h2>
            <p className="mt-1 text-[12px] text-text-caption">
              옵션명 + 가격 + 무료배송 뱃지
            </p>
          </div>
          <TextOptionSelect
            options={optionItems}
            isFreeShipping={product.freeShipping}
            onSelect={setSelectedText}
          />
          {selectedText && (
            <div className="mt-3 rounded-lg bg-bg px-4 py-3 text-[13px] text-text-secondary">
              선택:{' '}
              <span className="font-medium text-text">
                {selectedText.value.name}
              </span>{' '}
              · {formatWon(selectedText.value.price)}
            </div>
          )}
        </section>

        <section className="mt-4 rounded-2xl bg-bg-card p-6">
          <div className="mb-5">
            <h2 className="text-[13px] font-semibold text-text">
              2. 사이즈 옵션
            </h2>
            <p className="mt-1 text-[12px] text-text-caption">
              사이즈 번호 + 배송 도착보장 / 품절
            </p>
          </div>
          <SizeOptionSelect options={sizeItems} onSelect={setSelectedSize} />
          {selectedSize && (
            <div className="mt-3 rounded-lg bg-bg px-4 py-3 text-[13px] text-text-secondary">
              선택: 사이즈{' '}
              <span className="font-medium text-text">
                {selectedSize.value.value}
              </span>{' '}
              · 재고 {selectedSize.value.stock}개
            </div>
          )}
        </section>

        <section className="mt-4 rounded-2xl bg-bg-card p-6">
          <div className="mb-5">
            <h2 className="text-[13px] font-semibold text-text">
              3. 썸네일 옵션
            </h2>
            <p className="mt-1 text-[12px] text-text-caption">
              상품 이미지 + 할인율 + 가격 + 배송 뱃지
            </p>
          </div>
          <ThumbnailOptionSelect
            options={thumbnailItems}
            onSelect={setSelectedThumb}
          />
          {selectedThumb && (
            <div className="mt-3 rounded-lg bg-bg px-4 py-3 text-[13px] text-text-secondary">
              선택:{' '}
              <span className="font-medium text-text">
                {selectedThumb.value.name}
              </span>{' '}
              · {formatWon(selectedThumb.value.price)}
            </div>
          )}
        </section>

        {/* Dialog — uncontrolled 사용 예시 */}
        <section className="mt-4 rounded-2xl bg-bg-card p-6">
          <div className="mb-5">
            <h2 className="text-[13px] font-semibold text-text">
              Dialog (Uncontrolled)
            </h2>
            <p className="mt-1 text-[12px] text-text-caption">
              open prop 없이 내부 상태로 열림/닫힘을 관리합니다.
            </p>
          </div>
          <Dialog>
            <Dialog.Trigger>
              <span className="inline-flex h-11 items-center justify-center rounded-xl bg-text px-6 text-[14px] font-medium text-bg-card transition-colors hover:bg-text/90">
                Dialog 열기
              </span>
            </Dialog.Trigger>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-text/30 backdrop-blur-[2px]" />
            <Dialog.Content className="fixed inset-0 z-[51] flex items-center justify-center p-6">
              <div className="w-full max-w-[340px] rounded-2xl bg-bg-card p-7 shadow-[0_16px_48px_rgba(44,36,32,0.12)]">
                <Dialog.Title className="font-family-display text-[18px] font-normal text-text">
                  Uncontrolled Dialog
                </Dialog.Title>
                <Dialog.Description className="mt-3 text-[14px] leading-relaxed text-text-secondary">
                  이 Dialog는 open prop 없이 내부 상태만으로 동작합니다. Trigger
                  클릭으로 열고, Close 또는 Esc/오버레이 클릭으로 닫습니다.
                </Dialog.Description>
                <div className="mt-7">
                  <Dialog.Close className="flex h-12 w-full items-center justify-center rounded-xl border border-border text-[14px] font-medium text-text transition-colors hover:bg-bg">
                    닫기
                  </Dialog.Close>
                </div>
              </div>
            </Dialog.Content>
          </Dialog>
        </section>
      </div>
    </>
  );
}
