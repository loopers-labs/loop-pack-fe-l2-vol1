'use client';

import { Size } from './types';
import { useSelect } from './useSelect';

type Props = {
  products: Size[];
};

export const SizeSelect = ({ products }: Props) => {
  const {
    isOpen,
    selectedOption,
    highlightedIndex,
    handleToggle,
    handleSelect,
    handleKeyDown,
    handleHighlight,
  } = useSelect<Size>({
    options: products,
    isDisabled: (product) => product.stock === 0,
  });

  return (
    <div
      className="w-full rounded-2xl border border-gray-200"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between p-4"
        onClick={handleToggle}
      >
        <span className="text-gray-400">
          {selectedOption ? selectedOption.value : '사이즈'}
        </span>
        {isOpen ? (
          <span className="text-gray-400">^</span>
        ) : (
          <span className="text-gray-400">v</span>
        )}
      </button>
      {isOpen && (
        <ul className="divide-y divide-gray-100">
          {products.map((product, index) => (
            <li
              key={product.value}
              className={`p-4 ${highlightedIndex === index ? 'bg-gray-50' : ''} ${product.stock === 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              onClick={() => handleSelect(product)}
              onMouseOver={() => handleHighlight(index)}
            >
              <p className="text-lg font-bold">{product.value}</p>
              {product.stock > 0 && (
                <p className="mt-1 text-sm text-blue-500">🚚 내일 도착보장</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
