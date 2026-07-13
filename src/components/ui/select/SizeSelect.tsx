'use client';

import { useSelect } from './useSelect';
import { sizeOptions, SizeOption } from '@/app/api/products/route';

export function SizeSelect() {
  const { isOpen, selectedItem, getToggleButtonProps, getMenuProps, getItemProps } =
    useSelect<SizeOption>({
      items: sizeOptions,
      itemToKey: (item) => item.value,
      isItemDisabled: (item) => item.soldOut,
      initialSelectedItem: null,
    });

  return (
    <div style={{ width: 320, position: 'relative' }}>
      <button
        {...getToggleButtonProps()}
        style={{
          width: '100%',
          padding: '10px 14px',
          border: '1px solid #d0d6de',
          borderRadius: 6,
          background: '#fff',
          textAlign: 'left',
          cursor: 'pointer',
          fontSize: 14,
        }}
      >
        {selectedItem ? `사이즈 ${selectedItem.value}` : '사이즈'}
      </button>

      {isOpen && (
        <ul
          {...getMenuProps()}
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            border: '1px solid #d0d6de',
            borderRadius: 6,
            background: '#fff',
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
        >
          {sizeOptions.map((item, index) => {
            const { isSelected, isHighlighted, ...itemProps } = getItemProps({ item, index });
            let background = 'transparent';
            if (isSelected) background = '#e6f4ff';
            else if (isHighlighted) background = '#f0f0f0';

            return (
              <li
                key={item.value}
                {...itemProps}
                style={{
                  padding: '10px 14px',
                  cursor: itemProps.disabled ? 'not-allowed' : 'pointer',
                  opacity: itemProps.disabled ? 0.4 : 1,
                  background,
                  borderBottom: '1px solid #f0f0f0',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ fontWeight: 600 }}>사이즈 {item.value}</div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  {item.soldOut ? '품절' : item.arrivalText}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
