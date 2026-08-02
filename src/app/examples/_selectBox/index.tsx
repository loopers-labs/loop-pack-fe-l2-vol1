'use client';

import { PriceOptionAccordion } from './PriceOptionAccordion';
import { SizeOptionAccordion } from './SizeOptionAccordion';
import { ProductOptionAccordion } from './ProductOptionAccordion';
import { CompoundSelectBox } from './CompoundSelectBox';

function placeholderThumbnail(hex: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="${hex}"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const priceOptions = [
  {
    tag: '최대할인',
    name: '일반 배송',
    price: 21000,
    unitPriceLabel: '1개당 2,100원',
    freeShipping: true,
  },
  { name: '빠른 배송', price: 24000, unitPriceLabel: '1개당 2,400원' },
  { name: '새벽 배송', price: 25000, unitPriceLabel: '1개당 2,500원', freeShipping: true },
];

const sizeOptions = [
  { label: '230', deliveryLabel: '내일(토) 도착보장' },
  { label: '240', deliveryLabel: '내일(토) 도착보장' },
  { label: '250' },
];

const productOptions = [
  {
    thumbnailUrl: placeholderThumbnail('%23171717'),
    name: '스탠다드 코튼 티셔츠 - 블랙',
    discountPercent: 2,
    price: 19800,
    tag: '오늘드림',
  },
  {
    thumbnailUrl: placeholderThumbnail('%23e11d48'),
    name: '스탠다드 코튼 티셔츠 - 레드',
    price: 22000,
  },
  {
    thumbnailUrl: placeholderThumbnail('%232563eb'),
    name: '스탠다드 코튼 티셔츠 - 블루, 긴 이름이 두 줄로 넘어가는 경우를 확인하는 상품명',
    discountPercent: 10,
    price: 17800,
  },
];

export function SelectBoxExamples() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <p style={{ fontWeight: 700, marginBottom: 8 }}>Headless</p>
      <PriceOptionAccordion title="배송 옵션" options={priceOptions} onSelect={() => {}} />
      <SizeOptionAccordion title="사이즈 선택" sizes={sizeOptions} onSelect={() => {}} />
      <ProductOptionAccordion title="상품 옵션" options={productOptions} onSelect={() => {}} />
      <div>
        <p style={{ fontWeight: 700, marginBottom: 8 }}>Compound (기본 UI)</p>
        <CompoundSelectBox />
      </div>
    </div>
  );
}
