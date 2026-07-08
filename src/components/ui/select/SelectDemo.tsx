'use client';

import { useState } from 'react';

import { useSelect } from '@/components/ui/select/useSelect';

type ColorOption = {
  id: string;
  label: string;
  stock: number;
};

const colorOptions: ColorOption[] = [
  { id: 'black', label: 'Black', stock: 10 },
  { id: 'white', label: 'White', stock: 0 },
  { id: 'blue', label: 'Blue', stock: 3 },
];

export function SelectDemo() {
  const [selectedColor, setSelectedColor] = useState<ColorOption | null>(null);

  const select = useSelect({
    items: colorOptions,
    selectedItem: selectedColor,
    onSelectedItemChange: ({ selectedItem }) => {
      setSelectedColor(selectedItem);
    },
    itemToKey: (item) => item.id,
    isItemDisabled: (item) => item.stock === 0,
  });

  return (
    <div>
      <button type="button" {...select.getToggleButtonProps()}>
        {select.selectedItem?.label ?? '색상을 선택하세요'}
      </button>

      {select.isOpen && (
        <ul>
          {colorOptions.map((item, index) => {
            const isSelected =
              select.selectedItem !== null &&
              select.selectedItem.id === item.id;

            const isHighlighted = select.highlightedIndex === index;
            const isDisabled = item.stock === 0;

            return (
              <li
                key={item.id}
                {...select.getItemProps({ item, index })}
                style={{
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  opacity: isDisabled ? 0.4 : 1,
                  fontWeight: isSelected ? 700 : 400,
                  backgroundColor: isHighlighted ? '#eee' : 'transparent',
                }}
              >
                {item.label}
                {isDisabled ? ' (품절)' : ''}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
