'use client';

import { useSelect } from './hooks/useSelect';
import type { BaseSelectOption } from './types';

interface SelectProps<T extends BaseSelectOption> {
  options: T[];
  defaultValue?: T;
  placeholder?: string;
  onChange: (option: T) => void;
}

/**
 * floating 안쓰고 useSelect만 사용했을 때 케이스입니다.
 * - 마크업과 스타일링을 AI가 해주었습니다.
 */
export function Select<T extends BaseSelectOption>({
  options,
  defaultValue,
  placeholder = '선택하세요',
  onChange,
}: SelectProps<T>) {
  const { isOpen, selected, getToggleProps, getOptionProps, getOptionState } = useSelect({
    options,
    defaultValue,
    onChange,
  });

  return (
    <div className="relative w-60">
      <button
        {...getToggleProps()}
        className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left"
      >
        <span>{selected ? selected.value : placeholder}</span>
      </button>

      {isOpen && (
        <ul className="absolute mt-1 w-full rounded-md border shadow-md">
          {options.map((option, index) => {
            const { isHighlighted } = getOptionState(option, index);

            return (
              <li
                key={option.value}
                {...getOptionProps(option, index)}
                data-highlighted={isHighlighted}
                className="cursor-pointer px-3 py-2 data-[highlighted=true]:bg-black/5 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
              >
                {option.value}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
