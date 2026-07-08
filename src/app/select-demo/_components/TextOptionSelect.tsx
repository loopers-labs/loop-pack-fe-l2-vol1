'use client';

import { useSelect } from '@/components/ui/select';
import { ChevronIcon } from '@/components/icons/ChevronIcon';
import { formatWon } from '@/utils/format';
import type { SelectOption } from '@/components/ui/select';

type OptionValue = { id: string; name: string; price: number; stock: number };

interface TextOptionSelectProps {
  options: SelectOption<OptionValue>[];
  isFreeShipping?: boolean;
}

export function TextOptionSelect({
  options,
  isFreeShipping,
}: TextOptionSelectProps) {
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
          {selectedOption ? selectedOption.value.name : '옵션을 선택해 주세요'}
        </span>
        <ChevronIcon isOpen={isOpen} />
      </button>

      {isOpen && (
        <ul
          {...getMenuProps()}
          className="absolute z-10 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-border bg-bg-card shadow-[0_8px_30px_rgba(44,36,32,0.08)]"
        >
          {options.map((opt, i) => {
            const itemProps = getItemProps({ item: opt, index: i });
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
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[14px] text-text">
                      {opt.value.name}
                    </div>
                    <div className="mt-1.5 flex items-baseline gap-1.5">
                      <strong className="text-[15px] font-semibold text-text">
                        {formatWon(opt.value.price)}
                      </strong>
                    </div>
                  </div>
                  {isFreeShipping && opt.value.stock > 0 && (
                    <span className="shrink-0 rounded-full border border-accent/60 px-2.5 py-0.5 text-[11px] font-medium text-accent">
                      무료배송
                    </span>
                  )}
                  {opt.value.stock === 0 && (
                    <span className="shrink-0 text-[13px] text-text-caption">
                      품절
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
