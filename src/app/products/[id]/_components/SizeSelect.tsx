'use client';

import { useSelect } from '@/components/ui/select';
import { ChevronIcon } from '@/components/icons/ChevronIcon';
import { DeliveryIcon } from '@/components/icons/DeliveryIcon';
import type { SelectOption } from '@/components/ui/select';

type SizeValue = { value: number; stock: number };

interface SizeSelectProps {
  options: SelectOption<SizeValue>[];
}

export function SizeSelect({ options }: SizeSelectProps) {
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
        className="flex w-full items-center justify-between rounded-xl border border-border bg-bg-card py-3 pl-4 pr-3 transition-colors hover:border-text-caption aria-expanded:border-text-secondary"
      >
        <span
          className={`text-[14px] ${selectedOption ? 'font-medium text-text' : 'text-text-caption'}`}
        >
          {selectedOption
            ? `사이즈 ${selectedOption.value.value}`
            : '사이즈를 선택해 주세요'}
        </span>
        <span className="flex size-8 items-center justify-center">
          <ChevronIcon isOpen={isOpen} />
        </span>
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
                key={opt.value.value}
                {...itemProps}
                className={`cursor-pointer px-4 py-3 transition-colors
                  ${i > 0 ? 'border-t border-border/50' : ''}
                  ${itemProps['data-highlighted'] ? 'bg-brand-light' : ''}
                  ${itemProps['data-selected'] ? 'bg-brand-light' : ''}
                  ${itemProps['data-disabled'] ? 'cursor-not-allowed opacity-40' : ''}
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-medium text-text">
                    {opt.value.value}
                  </span>
                  {opt.value.stock > 0 ? (
                    <div className="flex items-center gap-1.5 text-[13px] text-accent">
                      <DeliveryIcon />
                      <span className="font-medium">내일 도착보장</span>
                    </div>
                  ) : (
                    <span className="text-[13px] text-text-caption">품절</span>
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
