'use client';

import { TextOption } from '@/types/products';
import { useSelect } from './useSelect';

type Props = {
  textOptions: TextOption[];
};

export const TextSelect = ({ textOptions }: Props) => {
  const {
    isOpen,
    selectedOption,
    highlightedIndex,
    handleToggle,
    handleSelect,
    handleKeyDown,
    handleHighlight,
  } = useSelect<TextOption>({
    options: textOptions,
    isDisabled: (textOption) => textOption.stock === 0,
  });

  return (
    <div
      className="w-full rounded-2xl border border-gray-100"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-t-2xl bg-gray-100 p-4"
        onClick={handleToggle}
      >
        <span className="font-bold">
          {selectedOption ? selectedOption.label : '옵션 선택'}
        </span>
        {isOpen ? (
          <span className="font-bold"> ^</span>
        ) : (
          <span className="font-bold"> v</span>
        )}
      </button>
      {isOpen && (
        <ul>
          {textOptions.map((textOption, index) => (
            <li
              key={textOption.id}
              className={`${highlightedIndex === index ? 'bg-gray-50' : ''} ${textOption.stock === 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              onClick={() => handleSelect(textOption)}
              onMouseOver={() => handleHighlight(index)}
            >
              <div className="flex items-center justify-between p-4">
                <div>
                  <div className="flex gap-1">
                    {textOption.isMaxDiscount && (
                      <span className="font-bold">[최대할인]</span>
                    )}
                    <span>{textOption.label}</span>
                  </div>
                  <div className="flex gap-1">
                    <span className="font-bold">{textOption.price}원</span>
                    <span>(1개당 {textOption.pricePerUnit}원)</span>
                  </div>
                </div>
                {textOption.freeShipping && (
                  <div className="rounded-full border border-orange-500">
                    <span className="px-2 py-6 font-bold text-orange-500">
                      무료배송
                    </span>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
