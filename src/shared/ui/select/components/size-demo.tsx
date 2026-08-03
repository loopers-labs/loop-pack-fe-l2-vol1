// demo1 — 사이즈 + 배송보장. 데이터: GET /api/products 의 demo1.
import { useMemo } from 'react';

import { FloatingPortal } from '@floating-ui/react';
import { twMerge } from 'tailwind-merge';

import { useProductOptions } from '@/services/useProductOptions';

import { useSelectFloating } from '../hooks/useSelectFloating';
import type { BaseSelectOption } from '../types';
import ChevronIcon from './chevron';
import { openedUp } from './util';

type SizeOption = BaseSelectOption & { delivery?: string };

export const SizeSelectDemo = () => {
  const { data, isLoading } = useProductOptions();
  const options = useMemo<SizeOption[]>(
    () =>
      (data?.demo1 ?? []).map((s) => ({
        value: String(s.value),
        disabled: s.stock === 0,
        delivery: s.delivery,
      })),
    [data],
  );

  const { isOpen, selected, placement, getToggleProps, getListboxProps, getOptionProps, getOptionState } =
    useSelectFloating<SizeOption>({ options });

  return (
    <div className="w-[420px]">
      <button
        {...getToggleProps()}
        className={twMerge(
          'flex w-full items-center justify-between gap-3 border border-gray-200 bg-white px-6 py-4 text-left text-base text-gray-900 shadow-sm transition hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40',
          !isOpen ? 'rounded-2xl' : openedUp(placement) ? 'rounded-b-2xl' : 'rounded-t-2xl',
        )}
      >
        <span className={selected ? 'font-semibold' : 'text-gray-400'}>
          {isLoading ? '불러오는 중…' : selected ? `사이즈 ${selected.value}` : '사이즈'}
        </span>
        <ChevronIcon open={isOpen} />
      </button>

      {isOpen && options.length > 0 && (
        <FloatingPortal>
          <ul
            {...getListboxProps()}
            className={twMerge(
              'z-50 max-h-[28rem] w-[420px] overflow-y-auto border border-gray-200 bg-white p-1.5 shadow-xl',
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
                    'rounded-xl px-4 py-3.5 transition-colors',
                    s.isDisabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
                    s.isHighlighted && !s.isDisabled && 'bg-gray-100',
                    s.isSelected && 'bg-blue-50',
                  )}
                >
                  <div
                    className={twMerge(
                      'text-lg font-semibold',
                      s.isSelected && 'font-bold text-blue-600',
                      s.isDisabled && 'line-through',
                    )}
                  >
                    {option.value}
                  </div>
                  {option.delivery && (
                    <div className="mt-1 flex items-center gap-1 text-sm text-blue-600">
                      <span aria-hidden>🚚</span>
                      {option.delivery}
                    </div>
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
