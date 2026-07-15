'use client';

import type { CSSProperties } from 'react';
import { useSelect } from './useSelect';
import {
  sizeOptions,
  thumbnailOptions,
  titlePriceOptions,
  type SizeOption,
  type ThumbnailOption,
  type TitlePriceOption,
} from '@/app/api/products/route';

export function SelectDemo() {
  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: '48px 24px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
        Select Demo — 세 가지 스타일
      </h1>
      <p style={{ fontSize: 13, color: '#8794a3', marginBottom: 32, lineHeight: 1.6 }}>
        같은 <code>useSelect</code> 로직 한 벌로 서로 다른 세 가지 생김새를 렌더합니다. 각 항목을
        클릭하거나 방향키로 탐색하세요. 콘솔에 선택 로그가 찍힙니다.
      </p>

      <section style={sectionStyle}>
        <div style={labelStyle}>1) 제목 + 가격 + 무료배송 뱃지</div>
        <TitlePriceSelect />
      </section>

      <section style={sectionStyle}>
        <div style={labelStyle}>2) 사이즈 + 도착요일 (품절 스킵)</div>
        <SizeSelect />
      </section>

      <section style={sectionStyle}>
        <div style={labelStyle}>3) 썸네일 이미지</div>
        <ThumbnailSelect />
      </section>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────
// 1) 제목 + 가격 + 무료배송 뱃지
// ─────────────────────────────────────────────────────────────
function TitlePriceSelect() {
  const { isOpen, selectedItem, getToggleButtonProps, getMenuProps, getItemProps } =
    useSelect<TitlePriceOption>({
      items: titlePriceOptions,
      itemToKey: (item) => item.id,
      initialSelectedItem: null,
    });

  return (
    <div style={{ width: 320, position: 'relative' }}>
      <button type="button" {...getToggleButtonProps()} style={toggleStyle}>
        {selectedItem
          ? `${selectedItem.name} · ${selectedItem.price.toLocaleString()}원`
          : '옵션 선택'}
      </button>

      {isOpen && (
        <ul {...getMenuProps()} style={menuStyle}>
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
                  ...itemRowStyle,
                  justifyContent: 'space-between',
                  background,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                    {item.price.toLocaleString()}원
                  </div>
                </div>
                {item.freeShipping && <span style={badgeStyle}>무료배송</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2) 사이즈 + 도착요일 (품절 스킵)
// ─────────────────────────────────────────────────────────────
function SizeSelect() {
  const { isOpen, selectedItem, getToggleButtonProps, getMenuProps, getItemProps } =
    useSelect<SizeOption>({
      items: sizeOptions,
      itemToKey: (item) => item.value,
      isItemDisabled: (item) => item.soldOut,
      initialSelectedItem: null,
    });

  return (
    <div style={{ width: 320, position: 'relative' }}>
      <button type="button" {...getToggleButtonProps()} style={toggleStyle}>
        {selectedItem ? `사이즈 ${selectedItem.value}` : '사이즈'}
      </button>

      {isOpen && (
        <ul {...getMenuProps()} style={{ ...menuStyle, maxHeight: 160, overflow: 'auto' }}>
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
                  ...itemRowStyle,
                  justifyContent: 'space-between',
                  cursor: itemProps.disabled ? 'not-allowed' : 'pointer',
                  opacity: itemProps.disabled ? 0.4 : 1,
                  background,
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

// ─────────────────────────────────────────────────────────────
// 3) 썸네일 이미지
// ─────────────────────────────────────────────────────────────
function ThumbnailSelect() {
  const { isOpen, selectedItem, getToggleButtonProps, getMenuProps, getItemProps } =
    useSelect<ThumbnailOption>({
      items: thumbnailOptions,
      itemToKey: (item) => item.id,
      initialSelectedItem: null,
    });

  return (
    <div style={{ width: 360, position: 'relative' }}>
      <button type="button" {...getToggleButtonProps()} style={toggleStyle}>
        {selectedItem ? selectedItem.name : '옵션을 선택해 주세요'}
      </button>

      {isOpen && (
        <ul {...getMenuProps()} style={menuStyle}>
          {thumbnailOptions.map((item, index) => {
            const { isSelected, isHighlighted, ...itemProps } = getItemProps({ item, index });

            let background = 'transparent';
            if (isSelected) background = '#e6f4ff';
            else if (isHighlighted) background = '#f0f0f0';

            return (
              <li
                key={item.id}
                {...itemProps}
                style={{
                  ...itemRowStyle,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={item.name}
                  width={40}
                  height={40}
                  style={{
                    borderRadius: 4,
                    background: '#f5f5f5',
                    objectFit: 'cover',
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                    {item.description}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 공통 스타일
// ─────────────────────────────────────────────────────────────
const sectionStyle: CSSProperties = {
  marginBottom: 32,
};

const labelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: '#5a6675',
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const toggleStyle: CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid #d0d6de',
  borderRadius: 6,
  background: '#fff',
  textAlign: 'left',
  cursor: 'pointer',
  fontSize: 14,
};

const menuStyle: CSSProperties = {
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
};

const itemRowStyle: CSSProperties = {
  padding: '10px 14px',
  cursor: 'pointer',
  borderBottom: '1px solid #f0f0f0',
  fontSize: 14,
  display: 'flex',
  alignItems: 'center',
};

const badgeStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: '#1f7a3f',
  background: '#e6f7ec',
  padding: '2px 8px',
  borderRadius: 10,
  whiteSpace: 'nowrap',
};
