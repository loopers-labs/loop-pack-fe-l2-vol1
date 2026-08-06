'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useSelect } from '@/shared/ui/select';
import type { OptionState, UseSelect } from '@/shared/ui/select';

// 세 데모 모두 같은 useSelect 로직을 쓴다. 다른 건 "옵션 생김새"뿐이다.
// value가 옵션 "객체 전체"라, 선택 결과로 가격·배송을 바로 계산해 요약에 쓴다.

const won = (n: number): string =>
  n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '원';

// ── 공통 chrome (테두리 + 헤더 토글 + 열림 리스트). 옵션 내부는 children이 소유 ──
function SelectFrame<T>({
  label,
  select,
  children,
}: {
  label: string;
  select: UseSelect<T>;
  children: ReactNode;
}) {
  return (
    <div style={styles.box}>
      <button {...select.getTriggerProps()} style={styles.header}>
        <span>{label}</span>
        <Chevron open={select.isOpen} />
      </button>
      {select.isOpen && (
        <ul {...select.getListProps()} style={styles.list}>
          {children}
        </ul>
      )}
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#8794a3"
      strokeWidth="2"
      aria-hidden
      style={{
        transition: 'transform .15s',
        transform: open ? 'rotate(180deg)' : 'none',
      }}
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 옵션의 공통 상호작용 스타일(highlight 배경 · 품절 흐림 · 커서). 색/강조는 각 데모가 얹는다.
const rowStyle = ({ highlighted, disabled }: OptionState): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '18px 20px',
  borderTop: '1px solid #eef0f3',
  cursor: disabled ? 'not-allowed' : 'pointer',
  background: highlighted ? '#f5f6f8' : '#fff',
  opacity: disabled ? 0.45 : 1,
});

// ───────────────── 데모 1: 사이즈 (품절 스킵) ─────────────────
type SizeOption = { value: number; stock: number };
const sizes: SizeOption[] = [
  { value: 24, stock: 3 },
  { value: 25, stock: 0 },
  { value: 26, stock: 12 },
  { value: 27, stock: 5 },
  { value: 28, stock: 0 },
];

function SizeSelect() {
  const select = useSelect<SizeOption>({
    items: sizes,
    itemToKey: (s) => s.value,
    isItemDisabled: (s) => s.stock === 0,
  });
  const picked = select.selectedItem;
  return (
    <section>
      <SelectFrame label="사이즈" select={select}>
        {sizes.map((size, i) => {
          const { selected, highlighted, disabled, ...dom } =
            select.getOptionProps(size, i);
          return (
            <li
              key={size.value}
              {...dom}
              style={rowStyle({ selected, highlighted, disabled })}
            >
              <div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: selected ? 800 : 500,
                    color: selected ? '#111' : '#18212e',
                  }}
                >
                  {size.value}
                </div>
                {disabled ? (
                  <span style={{ fontSize: 14, color: '#98a2b3' }}>품절</span>
                ) : (
                  <span
                    style={{ fontSize: 14, color: '#3b5bff', fontWeight: 600 }}
                  >
                    🚚 내일(토) 도착보장
                  </span>
                )}
              </div>
              {selected && <Check />}
            </li>
          );
        })}
      </SelectFrame>
      <Summary>
        {picked
          ? `선택: ${picked.value} · 남은 재고 ${picked.stock}개`
          : '사이즈를 선택하세요 (품절 25·28은 키보드 이동에서 건너뜀)'}
      </Summary>
    </section>
  );
}

// ───────────────── 데모 2: 수량 번들 (텍스트·가격) ─────────────────
type Bundle = {
  id: string;
  label: string;
  count: number;
  price: number;
  freeShipping: boolean;
};
const bundles: Bundle[] = [
  {
    id: 'b10',
    label: '[최대할인] 베이글 5+5개',
    count: 10,
    price: 21000,
    freeShipping: true,
  },
  { id: 'b1', label: '베이글 1개', count: 1, price: 4200, freeShipping: false },
];

function BundleSelect() {
  const select = useSelect<Bundle>({
    items: bundles,
    itemToKey: (b) => b.id,
  });
  const picked = select.selectedItem;
  return (
    <section>
      <SelectFrame label="옵션 선택" select={select}>
        {bundles.map((bundle, i) => {
          const { selected, highlighted, disabled, ...dom } =
            select.getOptionProps(bundle, i);
          const perUnit = Math.round(bundle.price / bundle.count);
          return (
            <li
              key={bundle.id}
              {...dom}
              style={rowStyle({ selected, highlighted, disabled })}
            >
              <div>
                <div
                  style={{ fontSize: 16, marginBottom: 6, color: '#18212e' }}
                >
                  {bundle.label}
                </div>
                <div>
                  <b style={{ fontSize: 20 }}>{won(bundle.price)}</b>{' '}
                  <span style={{ color: '#ff5a36', fontWeight: 600 }}>
                    (1개당 {won(perUnit)})
                  </span>
                </div>
              </div>
              {bundle.freeShipping && (
                <span style={styles.freePill}>무료배송</span>
              )}
            </li>
          );
        })}
      </SelectFrame>
      <Summary>
        {picked
          ? `합계 ${won(picked.price)} · 1개당 ${won(
              Math.round(picked.price / picked.count),
            )} · 배송 ${picked.freeShipping ? '무료' : '유료'}`
          : '수량을 선택하세요'}
      </Summary>
    </section>
  );
}

// ───────────────── 데모 3: 썸네일 상품 ─────────────────
type ProductOption = {
  id: string;
  name: string;
  price: number;
  discount: number;
  sameDay: boolean;
  tone: string;
};
const products: ProductOption[] = [
  {
    id: 'g100',
    name: '그로우턴 앰플 100ml기획(+100ml)',
    price: 38800,
    discount: 2,
    sameDay: true,
    tone: '#f3d9c6',
  },
  {
    id: 'g130',
    name: '그로우턴 앰플 130ml기획(+30ml)',
    price: 33800,
    discount: 2,
    sameDay: true,
    tone: '#e6ddce',
  },
];

function ThumbnailSelect() {
  const select = useSelect<ProductOption>({
    items: products,
    itemToKey: (p) => p.id,
  });
  const picked = select.selectedItem;
  return (
    <section>
      <SelectFrame label="옵션을 선택해 주세요" select={select}>
        {products.map((product, i) => {
          const { selected, highlighted, disabled, ...dom } =
            select.getOptionProps(product, i);
          return (
            <li
              key={product.id}
              {...dom}
              style={{
                ...rowStyle({ selected, highlighted, disabled }),
                justifyContent: 'flex-start',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 8,
                  background: product.tone,
                  border: selected ? '2px solid #111' : '1px solid #e5e7eb',
                  flexShrink: 0,
                }}
              />
              <div>
                <div
                  style={{ fontSize: 15, color: '#18212e', marginBottom: 4 }}
                >
                  {product.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#ff4d4f', fontWeight: 700 }}>
                    {product.discount}%
                  </span>
                  <b style={{ fontSize: 17 }}>{won(product.price)}</b>
                  {product.sameDay && (
                    <span style={styles.sameDayPill}>오늘드림</span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </SelectFrame>
      <Summary>
        {picked
          ? `선택: ${picked.name} · ${won(picked.price)}`
          : '상품을 선택하세요'}
      </Summary>
    </section>
  );
}

function Check() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#111"
      strokeWidth="2.5"
      aria-hidden
    >
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Summary({ children }: { children: ReactNode }) {
  return (
    <p style={{ margin: '10px 2px 0', fontSize: 13, color: '#8794a3' }}>
      {children}
    </p>
  );
}

export default function SelectDemoPage() {
  return (
    <main
      style={{ maxWidth: 560, margin: '0 auto', padding: '56px 20px 96px' }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
        Select (Headless)
      </h1>
      <p style={{ color: '#5a6675', lineHeight: 1.7, marginBottom: 32 }}>
        아래 셋은 <b>같은 useSelect 로직</b> 위에 옵션 생김새만 달리 그린 것.
        헤더를 눌러 열고(↑↓ 이동 · Enter 선택 · Esc 닫기), 품절은 건너뜁니다.
      </p>
      <div style={{ display: 'grid', gap: 40 }}>
        <SizeSelect />
        <BundleSelect />
        <ThumbnailSelect />
      </div>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  box: {
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
    background: '#fff',
  },
  header: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    background: '#f7f8f9',
    border: 'none',
    borderBottom: '1px solid #eef0f3',
    fontSize: 16,
    fontWeight: 700,
    color: '#18212e',
    cursor: 'pointer',
    textAlign: 'left',
  },
  list: { listStyle: 'none', margin: 0, padding: 0 },
  freePill: {
    flexShrink: 0,
    padding: '6px 12px',
    borderRadius: 999,
    border: '1px solid #ff5a36',
    color: '#ff5a36',
    fontSize: 13,
    fontWeight: 700,
  },
  sameDayPill: {
    padding: '3px 8px',
    borderRadius: 4,
    background: '#eef0f3',
    color: '#5a6675',
    fontSize: 12,
    fontWeight: 600,
  },
};
