'use client';

import { Product } from '@/types/products';
import Image from 'next/image';
import { useSelect } from './useSelect';

type Props = {
  products: Product[];
};
export const ThumbnailSelect = ({ products }: Props) => {
  const {
    isOpen,
    selectedOption,
    highlightedIndex,
    handleToggle,
    handleSelect,
    handleKeyDown,
    handleHighlight,
  } = useSelect<Product>({
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
        <span className="text-gray-500">
          {selectedOption ? selectedOption.name : '옵션을 선택해 주세요'}
        </span>
        {isOpen ? (
          <span className="font-bold"> ^</span>
        ) : (
          <span className="font-bold"> v</span>
        )}
      </button>
      {isOpen && (
        <ul className="divide-y divide-gray-100">
          {products.map((product, index) => (
            <li
              key={product.id}
              className={`flex items-center gap-4 p-4 ${highlightedIndex === index ? 'bg-gray-50' : ''} ${product.stock === 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              onClick={() => handleSelect(product)}
              onMouseOver={() => handleHighlight(index)}
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <p className="font-medium">{product.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  {product.originalPrice && (
                    <span className="text-sm font-bold text-red-500">
                      {Math.round(
                        (1 - product.price / product.originalPrice) * 100,
                      )}
                      %
                    </span>
                  )}
                  <span className="font-bold">{product.price} 원</span>
                  {product.freeShipping ? (
                    <span className="rounded-full bg-pink-50 px-2 py-0.5 text-xs text-pink-500">
                      무료배송
                    </span>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                      품절
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
