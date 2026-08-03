import { useMemo } from 'react';

import { FloatingPortal } from '@floating-ui/react';
import { twMerge } from 'tailwind-merge';

import { useProductOptions } from '@/services/useProductOptions';

import { useSelectFloating } from '../hooks/useSelectFloating';
import type { BaseSelectOption } from '../types';
import ChevronIcon from './chevron';
import { formatWonPrice, openedUp } from './util';

type BundleOption = BaseSelectOption & {
  label: string;
  price: number;
  unitPrice: number;
  freeShipping?: boolean;
  promo?: string;
};

export const BundleSelectDemo = () => {
  const { data, isLoading } = useProductOptions();

  const options = useMemo<BundleOption[]>(
    () =>
      (data?.demo3 ?? []).map((o) => ({
        value: o.id,
        label: o.label,
        promo: o.promo,
        price: o.price,
        unitPrice: Math.round(o.price / o.quantity),
        freeShipping: o.freeShipping,
        disabled: o.stock === 0,
      })),
    [data],
  );

  const { isOpen, selected, placement, getToggleProps, getListboxProps, getOptionProps, getOptionState } =
    useSelectFloating<BundleOption>({ options });

  return (
    <div className="w-full max-w-[560px]">
      <button
        {...getToggleProps()}
        className={twMerge(
          'flex w-full items-center justify-between border border-[#E7DCC8] bg-[#FAF4EA] px-6 py-4 text-left text-lg font-semibold tracking-tight text-[#33261B] shadow-[0_1px_2px_rgba(51,38,27,0.05)] transition-colors hover:bg-[#F4EADB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D2571F]/40',
          !isOpen ? 'rounded-2xl' : openedUp(placement) ? 'rounded-b-2xl' : 'rounded-t-2xl',
        )}
      >
        <span>{isLoading ? '불러오는 중…' : selected ? selected.label : '옵션 선택'}</span>
        <ChevronIcon open={isOpen} />
      </button>

      {isOpen && options.length > 0 && (
        <FloatingPortal>
          <ul
            {...getListboxProps()}
            className={twMerge(
              'z-50 w-[min(560px,calc(100vw-2rem))] divide-y divide-[#EFE6D6] overflow-hidden border border-[#E7DCC8] bg-white shadow-[0_16px_40px_-12px_rgba(51,38,27,0.18)]',
              openedUp(placement) ? 'rounded-t-2xl border-b-0' : 'rounded-b-2xl border-t-0',
            )}
          >
            {options.map((option, index) => {
              const s = getOptionState(option, index);

              return (
                <li
                  key={option.value}
                  {...getOptionProps(option, index)}
                  className={twMerge(
                    'flex items-center justify-between gap-4 px-6 py-4 transition-colors',
                    s.isDisabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
                    s.isHighlighted && !s.isDisabled && 'bg-[#F6EADF]',
                    s.isSelected && 'bg-[#FBEADF]',
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-[#33261B]">
                      {option.promo && <span className="text-[#D2571F]">[{option.promo}] </span>}
                      {option.label}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xl font-bold tabular-nums text-[#33261B]">
                        {formatWonPrice(option.price)}
                      </span>
                      <span className="rounded-md bg-[#FBEADF] px-2 py-0.5 text-[13px] font-semibold tabular-nums text-[#D2571F]">
                        1개당 {formatWonPrice(option.unitPrice)}
                      </span>
                    </div>
                  </div>
                  {option.freeShipping && (
                    <span className="shrink-0 rounded-full border border-[#D2571F] px-4 py-1.5 text-sm font-semibold text-[#D2571F]">
                      무료배송
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </FloatingPortal>
      )}
    </div>
  );
};
