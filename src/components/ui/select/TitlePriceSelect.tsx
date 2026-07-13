'use client';

import { useSelect } from './useSelect';
import { titlePriceOptions, TitlePriceOption } from '@/app/api/products/route';

export function TitlePriceSelect() {
  const { isOpen, selectedItem, getToggleButtonProps, getMenuProps, getItemProps } =
    useSelect<TitlePriceOption>({
      items: titlePriceOptions,
      itemToKey: (item) => item.id,
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
        {selectedItem
          ? `${selectedItem.name} · ${selectedItem.price.toLocaleString()}원`
          : '옵션 선택'}
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
          {titlePriceOptions.map((item, index) => {
            const { isSelected, isHighlighted, ...itemProps } = getItemProps({ item, index });

            let background = 'transparent';
            if (isSelected) background = '#e6f4ff';
            else if (isHighlighted) background = '#f0f0f0';

            return (
              <li
                key={item.id}
                {...itemProps}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  background,
                  borderBottom: '1px solid #f0f0f0',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                    {item.price.toLocaleString()}원
                  </div>
                </div>
                {item.freeShipping && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#1f7a3f',
                      background: '#e6f7ec',
                      padding: '2px 8px',
                      borderRadius: 10,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    무료배송
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
