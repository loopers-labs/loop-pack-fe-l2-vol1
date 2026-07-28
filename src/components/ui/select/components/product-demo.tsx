// demo2 — 썸네일 + 상품명 + 할인/가격 + 뱃지. 데이터: GET /api/products 의 demo2.
import { useMemo } from 'react';

import { FloatingPortal } from '@floating-ui/react';
import { twMerge } from 'tailwind-merge';

import { useProductOptions } from '@/services/useProductOptions';

import { useSelectFloating } from '../hooks/useSelectFloating';
import type { BaseSelectOption } from '../types';
import ChevronIcon from './chevron';
import { formatWonPrice, openedUp } from './util';

type ProductOption = BaseSelectOption & {
  name: string;
  discountRate?: number;
  price: number;
  badge?: string;
};

export const ProductSelectDemo = () => {
  const { data, isLoading } = useProductOptions();

  const options = useMemo<ProductOption[]>(
    () =>
      (data?.demo2 ?? []).map((o) => ({
        value: o.id,
        name: o.name,
        discountRate: o.discountRate,
        price: o.price,
        badge: o.sameDayDelivery ? '오늘드림' : undefined,
        disabled: o.stock === 0,
      })),
    [data],
  );

  const { isOpen, selected, placement, getToggleProps, getListboxProps, getOptionProps, getOptionState } =
    useSelectFloating<ProductOption>({ options });

  return (
    <div className="w-[520px]">
      <button
        {...getToggleProps()}
        className={twMerge(
          'flex w-full items-center justify-between gap-3 border border-gray-200 bg-white px-6 py-4 text-left text-base font-medium text-gray-900 shadow-sm transition hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40',
          !isOpen ? 'rounded-2xl' : openedUp(placement) ? 'rounded-b-2xl' : 'rounded-t-2xl',
        )}
      >
        <span className="min-w-0 truncate">
          {isLoading ? '불러오는 중…' : selected ? selected.name : '옵션을 선택해 주세요'}
        </span>
        <ChevronIcon open={isOpen} />
      </button>

      {isOpen && options.length > 0 && (
        <FloatingPortal>
          <ul
            {...getListboxProps()}
            className={twMerge(
              'z-50 max-h-[28rem] w-[520px] overflow-y-auto border border-gray-200 bg-white p-1.5 shadow-xl',
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
                    'flex gap-4 rounded-xl px-4 py-3.5 transition-colors',
                    s.isDisabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
                    s.isHighlighted && !s.isDisabled && 'bg-gray-100',
                    s.isSelected && 'bg-blue-50',
                  )}
                >
                  <div className="h-20 w-20 shrink-0 rounded-lg bg-gradient-to-br from-orange-100 to-orange-200" />
                  <div className="min-w-0 flex-1">
                    <p className={twMerge('truncate text-[15px]', s.isSelected && 'font-bold')}>{option.name}</p>
                    <div className="mt-2 flex items-center gap-2">
                      {option.discountRate != null && (
                        <span className="font-bold text-red-500">{option.discountRate}%</span>
                      )}
                      <span className="text-xl font-bold">{formatWonPrice(option.price)}</span>
                      {option.badge && (
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{option.badge}</span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </FloatingPortal>
      )}
    </div>
  );
};
