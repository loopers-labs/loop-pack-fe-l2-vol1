'use client';

import { useSelect } from '@/components/ui/select';
import { ChevronIcon } from '@/components/icons/ChevronIcon';
import { formatWon } from '@/utils/format';
import type { Product } from '@/types/product';
import type { SelectOption } from '@/components/ui/select';

interface ThumbnailOptionSelectProps {
  options: SelectOption<Product>[];
}

export function ThumbnailOptionSelect({ options }: ThumbnailOptionSelectProps) {
  const {
    isOpen,
    selectedOption,
    containerRef,
    getToggleButtonProps,
    getMenuProps,
    getItemProps,
  } = useSelect({ options });

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        {...getToggleButtonProps()}
        className="flex w-full items-center justify-between rounded-xl border border-border bg-bg-card px-5 py-4 transition-colors hover:border-text-caption aria-expanded:border-text-secondary"
      >
        <span
          className={`text-[14px] ${selectedOption ? 'font-medium text-text' : 'text-text-caption'}`}
        >
          {selectedOption ? selectedOption.value.name : '상품을 선택해 주세요'}
        </span>
        <ChevronIcon isOpen={isOpen} />
      </button>

      {isOpen && (
        <ul
          {...getMenuProps()}
          className="absolute z-10 mt-2 max-h-80 w-full overflow-auto rounded-xl border border-border bg-bg-card shadow-[0_8px_30px_rgba(44,36,32,0.08)]"
        >
          {options.map((opt, i) => {
            const itemProps = getItemProps({ item: opt, index: i });
            const discount = opt.value.originalPrice
              ? Math.round(
                  ((opt.value.originalPrice - opt.value.price) /
                    opt.value.originalPrice) *
                    100,
                )
              : 0;

            return (
              <li
                key={opt.value.id}
                {...itemProps}
                className={`cursor-pointer px-5 py-4 transition-colors
                  ${i > 0 ? 'border-t border-border/50' : ''}
                  ${itemProps['data-highlighted'] ? 'bg-brand-light' : ''}
                  ${itemProps['data-selected'] ? 'bg-brand-light' : ''}
                  ${itemProps['data-disabled'] ? 'cursor-not-allowed opacity-40' : ''}
                `}
              >
                <div className="flex items-center gap-4">
                  <img
                    src={opt.value.imageUrl}
                    alt={opt.value.name}
                    width={56}
                    height={56}
                    className="size-14 shrink-0 rounded-xl border border-border bg-bg object-contain p-1"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] text-text">
                      {opt.value.name}
                    </div>
                    <div className="mt-1.5 flex items-baseline gap-1.5">
                      {discount > 0 && (
                        <span className="text-[13px] font-semibold text-discount">
                          {discount}%
                        </span>
                      )}
                      <strong className="text-[14px] font-semibold text-text">
                        {formatWon(opt.value.price)}
                      </strong>
                      <span className="rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-medium text-brand">
                        {opt.value.deliveryType}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
