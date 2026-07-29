'use client';

import {
  autoUpdate,
  flip,
  offset,
  size,
  useFloating,
} from '@floating-ui/react';
import { Fragment, useState } from 'react';

import { useSelect } from '@/shared/ui/select/useSelect';

type SizeOption = {
  id: string;
  label: string;
  deliveryLabel: string;
  stock: number;
};

type ThumbnailOption = {
  id: string;
  name: string;
  thumbnailColor: string;
  discountRate: number;
  price: number;
  badgeLabel: string;
  stock: number;
};

type TextOption = {
  id: string;
  name: string;
  price: number;
  unitPrice: number;
  badgeLabel: string | null;
  stock: number;
};

const COLOR_TONE_LABEL = {
  warm: '웜 톤',
  cool: '쿨 톤',
  neutral: '뉴트럴 톤',
} as const;
type ColorTone = keyof typeof COLOR_TONE_LABEL;

type ColorOption = {
  id: string;
  name: string;
  color: string;
  stock: number;
  tone: ColorTone;
};

type SelectDemoOptions = {
  sizeOptions: SizeOption[];
  thumbnailOptions: ThumbnailOption[];
  textOptions: TextOption[];
  colorOptions: ColorOption[];
};

// 5주차 스타터가 /api/products를 커머스 API로 교체해서 데모 데이터는 로컬 상수로 유지한다
const DEMO_SELECT_OPTIONS: SelectDemoOptions = {
  sizeOptions: [
    { id: '23', label: '23', deliveryLabel: '내일(토) 도착보장', stock: 0 },
    { id: '24', label: '24', deliveryLabel: '내일(토) 도착보장', stock: 5 },
    { id: '25', label: '25', deliveryLabel: '내일(토) 도착보장', stock: 0 },
    { id: '26', label: '26', deliveryLabel: '내일(토) 도착보장', stock: 2 },
    { id: '27', label: '27', deliveryLabel: '내일(토) 도착보장', stock: 0 },
    { id: '28', label: '28', deliveryLabel: '내일(토) 도착보장', stock: 4 },
    { id: '29', label: '29', deliveryLabel: '내일(토) 도착보장', stock: 1 },
    { id: '30', label: '30', deliveryLabel: '내일(토) 도착보장', stock: 7 },
    { id: '31', label: '31', deliveryLabel: '내일(토) 도착보장', stock: 0 },
    { id: '32', label: '32', deliveryLabel: '내일(토) 도착보장', stock: 3 },
  ],
  thumbnailOptions: [
    {
      id: '100ml',
      name: '그로우턴 앰플 100ml기획(+100ml)',
      thumbnailColor: '#e8956d',
      discountRate: 2,
      price: 38800,
      badgeLabel: '오늘드림',
      stock: 5,
    },
    {
      id: '130ml',
      name: '그로우턴 앰플 130ml기획(+30ml)',
      thumbnailColor: '#f0c0a8',
      discountRate: 2,
      price: 33800,
      badgeLabel: '오늘드림',
      stock: 3,
    },
    {
      id: '50ml-mini',
      name: '그로우턴 앰플 미니 50ml',
      thumbnailColor: '#f5dcc8',
      discountRate: 5,
      price: 19800,
      badgeLabel: '오늘드림',
      stock: 0,
    },
    {
      id: 'double-set',
      name: '그로우턴 앰플 더블 세트(100ml×2)',
      thumbnailColor: '#d98a5f',
      discountRate: 10,
      price: 69800,
      badgeLabel: '오늘드림',
      stock: 2,
    },
  ],
  textOptions: [
    {
      id: 'bagel-20',
      name: '[대용량] 베이글 10+10개',
      price: 38000,
      unitPrice: 1900,
      badgeLabel: '무료배송',
      stock: 3,
    },
    {
      id: 'bagel-15',
      name: '베이글 15개',
      price: 30000,
      unitPrice: 2000,
      badgeLabel: '무료배송',
      stock: 0,
    },
    {
      id: 'bagel-10',
      name: '[최대할인] 베이글 5+5개',
      price: 21000,
      unitPrice: 2100,
      badgeLabel: '무료배송',
      stock: 5,
    },
    {
      id: 'bagel-7',
      name: '베이글 7개',
      price: 15400,
      unitPrice: 2200,
      badgeLabel: '무료배송',
      stock: 2,
    },
    {
      id: 'bagel-5',
      name: '베이글 5개',
      price: 11000,
      unitPrice: 2200,
      badgeLabel: '무료배송',
      stock: 0,
    },
    {
      id: 'bagel-4',
      name: '베이글 4개',
      price: 9600,
      unitPrice: 2400,
      badgeLabel: null,
      stock: 6,
    },
    {
      id: 'bagel-3',
      name: '베이글 3개',
      price: 7500,
      unitPrice: 2500,
      badgeLabel: null,
      stock: 4,
    },
    {
      id: 'bagel-2',
      name: '베이글 2개',
      price: 5600,
      unitPrice: 2800,
      badgeLabel: null,
      stock: 0,
    },
    {
      id: 'bagel-1',
      name: '베이글 1개',
      price: 4200,
      unitPrice: 4200,
      badgeLabel: null,
      stock: 10,
    },
  ],
  // 그룹 select 데모용. tone 순으로 정렬해 내려준다 (사용처가 인접 경계로 그룹 라벨을 그린다)
  colorOptions: [
    {
      id: 'terracotta',
      name: '테라코타',
      color: '#c96f4a',
      stock: 4,
      tone: 'warm',
    },
    { id: 'walnut', name: '월넛', color: '#6b4a35', stock: 1, tone: 'warm' },
    {
      id: 'blush',
      name: '블러시 핑크',
      color: '#e6b7b0',
      stock: 0,
      tone: 'warm',
    },
    {
      id: 'dusty-blue',
      name: '더스티 블루',
      color: '#7d94ad',
      stock: 3,
      tone: 'cool',
    },
    {
      id: 'sage',
      name: '세이지 그린',
      color: '#9caf88',
      stock: 2,
      tone: 'cool',
    },
    { id: 'olive', name: '올리브', color: '#8a8f5c', stock: 0, tone: 'cool' },
    { id: 'cream', name: '크림', color: '#f3ead8', stock: 2, tone: 'neutral' },
    {
      id: 'ivory',
      name: '아이보리',
      color: '#f6f1e7',
      stock: 6,
      tone: 'neutral',
    },
    {
      id: 'charcoal',
      name: '차콜',
      color: '#3d3d3f',
      stock: 5,
      tone: 'neutral',
    },
  ],
};

const isSoldOut = (item: { stock: number }) => item.stock === 0;

const triggerClassName =
  'flex w-100 cursor-pointer items-center justify-between rounded-xl border border-[#e0e0e0] bg-white px-5 py-4.5 text-base';

const menuClassName =
  'z-10 list-none overflow-x-hidden overflow-y-auto rounded-xl border border-[#e0e0e0] bg-white shadow-lg';

// 메뉴가 아래 컨텐츠를 밀지 않고 트리거 아래에 뜨도록 popover로 렌더한다 (위치 계산은 과제 지침대로 @floating-ui/react)
// maxHeight를 주면 목록이 길 때 메뉴 안에서 스크롤된다
function useSelectPopover(
  isOpen: boolean,
  { maxHeight }: { maxHeight?: number } = {},
) {
  return useFloating({
    open: isOpen,
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(6),
      flip({ padding: 8 }),
      size({
        apply({ rects, elements, availableHeight }) {
          elements.floating.style.width = `${rects.reference.width}px`;
          elements.floating.style.maxHeight = `${Math.max(
            0,
            Math.min(availableHeight - 8, maxHeight ?? Infinity),
          )}px`;
        },
      }),
    ],
  });
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={`text-[#555] transition-transform ${isOpen ? 'rotate-180' : ''}`}
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="2"
        y="6"
        width="12"
        height="10"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M14 9.5h4l3.5 3.5v3h-7.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="18" r="1.7" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="17" cy="18" r="1.7" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

// 이미지 1 (사이즈 옵션) — uncontrolled + defaultSelectedItem: hook이 상태를 소유하고 초기 선택값만 넘긴다
function SizeSelectDemo({ items }: { items: SizeOption[] }) {
  const select = useSelect({
    items,
    defaultSelectedItem: items[1],
    itemToKey: (item) => item.id,
    isItemDisabled: isSoldOut,
  });
  const { refs, floatingStyles } = useSelectPopover(select.isOpen, {
    maxHeight: 360,
  });

  return (
    <div className="w-100">
      <button
        type="button"
        {...select.getToggleButtonProps({ ref: refs.setReference })}
        aria-label="사이즈 선택"
        className={triggerClassName}
      >
        <span
          className={select.selectedItem ? 'text-[#111]' : 'text-[#767676]'}
        >
          {select.selectedItem?.label ?? '사이즈'}
        </span>
        <ChevronIcon isOpen={select.isOpen} />
      </button>

      {select.isOpen && (
        <ul
          {...select.getMenuProps({ ref: refs.setFloating })}
          style={floatingStyles}
          className={menuClassName}
        >
          {items.map((item, index) => (
            <li
              key={item.id}
              {...select.getItemProps({ item, index })}
              className="group cursor-pointer border-b border-[#f2f2f2] bg-white px-6 py-4 last:border-b-0 data-disabled:cursor-not-allowed data-disabled:opacity-40 data-highlighted:bg-[#f7f7f7]"
            >
              <div className="text-lg font-medium group-data-selected:font-bold">
                {item.label}
              </div>
              <div
                className={`mt-1.5 flex items-center gap-1.5 text-[15px] ${
                  isSoldOut(item) ? 'text-[#888]' : 'text-[#2b4df0]'
                }`}
              >
                {isSoldOut(item) ? (
                  '품절'
                ) : (
                  <>
                    <TruckIcon />
                    {item.deliveryLabel}
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// 이미지 2 (썸네일 옵션) — uncontrolled 최소 사용: 필수 파라미터만 넘기고 선택 상태는 전부 hook에 맡긴다
function ThumbnailSelectDemo({ items }: { items: ThumbnailOption[] }) {
  const select = useSelect({
    items,
    itemToKey: (item) => item.id,
    isItemDisabled: isSoldOut,
  });
  const { refs, floatingStyles } = useSelectPopover(select.isOpen);

  return (
    <div className="w-100">
      <button
        type="button"
        {...select.getToggleButtonProps({ ref: refs.setReference })}
        aria-label="상품 옵션 선택"
        className={triggerClassName}
      >
        <span className="font-bold text-[#111]">
          {select.selectedItem?.name ?? '옵션을 선택해 주세요'}
        </span>
        <ChevronIcon isOpen={select.isOpen} />
      </button>

      {select.isOpen && (
        <ul
          {...select.getMenuProps({ ref: refs.setFloating })}
          style={floatingStyles}
          className={menuClassName}
        >
          {items.map((item, index) => (
            <li
              key={item.id}
              {...select.getItemProps({ item, index })}
              className="group flex cursor-pointer items-center gap-5 border-b border-[#f5f5f5] bg-white px-6 py-5 last:border-b-0 data-disabled:cursor-not-allowed data-disabled:opacity-40 data-highlighted:bg-[#f7f7f7]"
            >
              <div
                className="h-22 w-16 shrink-0 rounded-md group-data-selected:outline-2 group-data-selected:outline-solid group-data-selected:outline-[#111]"
                style={{ backgroundColor: item.thumbnailColor }}
              />
              <div className="min-w-0">
                <div className="truncate text-base font-normal group-data-selected:font-bold">
                  {item.name}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[17px] font-bold text-[#e9435a]">
                    {item.discountRate}%
                  </span>
                  <span className="text-[17px] font-bold">
                    {item.price.toLocaleString()}원
                  </span>
                  <span
                    className={`rounded px-2 py-0.75 text-[13px] ${
                      isSoldOut(item)
                        ? 'bg-[#f0f0f0] text-[#888]'
                        : 'bg-[#fceef1] text-[#f04e6e]'
                    }`}
                  >
                    {isSoldOut(item) ? '품절' : item.badgeLabel}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// 이미지 3 (텍스트 옵션) — controlled: 사용처 state가 source of truth라 밖에서 읽거나 초기화할 수 있다
function TextSelectDemo({ items }: { items: TextOption[] }) {
  const [selectedOption, setSelectedOption] = useState<TextOption | null>(null);

  const select = useSelect({
    items,
    selectedItem: selectedOption,
    onSelectedItemChange: ({ selectedItem }) => setSelectedOption(selectedItem),
    itemToKey: (item) => item.id,
    isItemDisabled: isSoldOut,
  });
  const { refs, floatingStyles } = useSelectPopover(select.isOpen, {
    maxHeight: 360,
  });

  return (
    <div className="w-100">
      <button
        type="button"
        {...select.getToggleButtonProps({ ref: refs.setReference })}
        aria-label="구성 옵션 선택"
        className={triggerClassName}
      >
        <span className="font-bold text-[#111]">
          {select.selectedItem?.name ?? '옵션 선택'}
        </span>
        <ChevronIcon isOpen={select.isOpen} />
      </button>

      {select.isOpen && (
        <ul
          {...select.getMenuProps({ ref: refs.setFloating })}
          style={floatingStyles}
          className={menuClassName}
        >
          {items.map((item, index) => (
            <li
              key={item.id}
              {...select.getItemProps({ item, index })}
              className="group flex cursor-pointer items-center justify-between gap-4 border-b border-[#f2f2f2] bg-white px-5 py-4.5 last:border-b-0 data-disabled:cursor-not-allowed data-disabled:opacity-40 data-highlighted:bg-[#f7f7f7]"
            >
              <div>
                <div className="text-[15px] text-[#111] group-data-selected:font-bold">
                  {item.name}
                </div>
                <div className="mt-1.5">
                  <span className="text-[17px] font-bold">
                    {item.price.toLocaleString()}원
                  </span>{' '}
                  <span className="text-[15px] text-[#f2670d]">
                    (1개당 {item.unitPrice.toLocaleString()}원)
                  </span>
                </div>
              </div>
              {(isSoldOut(item) || item.badgeLabel) && (
                <span
                  className={`whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-bold ${
                    isSoldOut(item)
                      ? 'border-[#bbb] text-[#888]'
                      : 'border-[#f2670d] text-[#f2670d]'
                  }`}
                >
                  {isSoldOut(item) ? '품절' : item.badgeLabel}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex items-center justify-between text-sm text-[#5a6675]">
        <span>
          {selectedOption
            ? `선택됨: ${selectedOption.name} · ${selectedOption.price.toLocaleString()}원`
            : '선택된 옵션 없음'}
        </span>
        {selectedOption && (
          <button
            type="button"
            className="cursor-pointer font-bold underline"
            onClick={() => setSelectedOption(null)}
          >
            초기화
          </button>
        )}
      </div>
    </div>
  );
}

// 그룹 옵션 — 그룹 라벨·구분 렌더까지 사용처가 소유한다 (Radix 'grouped items' 대응). 키보드 이동은 옵션끼리만 탄다
function GroupedSelectDemo({ items }: { items: ColorOption[] }) {
  const select = useSelect({
    items,
    itemToKey: (item) => item.id,
    isItemDisabled: isSoldOut,
  });
  const { refs, floatingStyles } = useSelectPopover(select.isOpen, {
    maxHeight: 360,
  });

  return (
    <div className="w-100">
      <button
        type="button"
        {...select.getToggleButtonProps({ ref: refs.setReference })}
        aria-label="색상 선택"
        className={triggerClassName}
      >
        {select.selectedItem ? (
          <span className="flex items-center gap-2.5">
            <span
              className="h-5 w-5 rounded-full border border-black/10"
              style={{ backgroundColor: select.selectedItem.color }}
            />
            <span className="text-[#111]">{select.selectedItem.name}</span>
          </span>
        ) : (
          <span className="text-[#767676]">색상 선택</span>
        )}
        <ChevronIcon isOpen={select.isOpen} />
      </button>

      {select.isOpen && (
        <ul
          {...select.getMenuProps({ ref: refs.setFloating })}
          style={floatingStyles}
          className={`${menuClassName} pb-2`}
        >
          {items.map((item, index) => {
            // ✓ 표시처럼 콘텐츠가 바뀌는 곳은 CSS로 못 가리므로 노출된 selectedItem에서 파생한다
            const selected = select.selectedItem?.id === item.id;
            // 응답이 tone 순으로 정렬돼 있다는 전제로, tone이 바뀌는 경계에만 그룹 라벨을 그린다
            const isGroupStart =
              index === 0 || items[index - 1].tone !== item.tone;

            return (
              <Fragment key={item.id}>
                {isGroupStart && (
                  <li
                    role="presentation"
                    className="border-t border-[#f2f2f2] px-5 pt-3.5 pb-1.5 text-[13px] font-bold text-[#8794a3] first:border-t-0"
                  >
                    {COLOR_TONE_LABEL[item.tone]}
                  </li>
                )}
                <li
                  {...select.getItemProps({ item, index })}
                  className="flex cursor-pointer items-center gap-3 bg-white px-5 py-2.5 text-[15px] data-disabled:cursor-not-allowed data-disabled:opacity-40 data-highlighted:bg-[#f7f7f7]"
                >
                  <span
                    className="h-5 w-5 shrink-0 rounded-full border border-black/10"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className={selected ? 'font-bold' : ''}>
                    {item.name}
                  </span>
                  {isSoldOut(item) && (
                    <span className="text-[13px] text-[#888]">품절</span>
                  )}
                  {selected && (
                    <span className="ml-auto text-[#2b4df0]">✓</span>
                  )}
                </li>
              </Fragment>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const actionButtonClassName =
  'cursor-pointer rounded-lg border border-[#d0d5db] bg-white px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40';

// 액션 제어 — prop getter 없이도 노출된 액션(openMenu/closeMenu/selectItem)으로 밖에서 조작한다 (Downshift 'action props' 대응)
function ActionPropsSelectDemo({ items }: { items: TextOption[] }) {
  const select = useSelect({
    items,
    itemToKey: (item) => item.id,
    isItemDisabled: isSoldOut,
  });
  const { refs, floatingStyles } = useSelectPopover(select.isOpen, {
    maxHeight: 300,
  });

  const inStockItems = items.filter((item) => item.stock > 0);
  const bestUnitPriceOption =
    [...inStockItems].sort((a, b) => a.unitPrice - b.unitPrice)[0] ?? null;

  return (
    <div className="w-100">
      {/* 메뉴가 트리거 아래로 뜨므로 액션 버튼은 위에 둬야 열려 있는 동안에도 누를 수 있다 */}
      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          className={actionButtonClassName}
          onClick={select.openMenu}
        >
          openMenu
        </button>
        <button
          type="button"
          className={actionButtonClassName}
          onClick={select.closeMenu}
        >
          closeMenu
        </button>
        <button
          type="button"
          className={actionButtonClassName}
          disabled={bestUnitPriceOption === null}
          onClick={() => select.selectItem(bestUnitPriceOption)}
        >
          1개당 최저가 선택
        </button>
        <button
          type="button"
          className={actionButtonClassName}
          onClick={() => select.selectItem(null)}
        >
          선택 비우기
        </button>
      </div>

      <button
        type="button"
        {...select.getToggleButtonProps({ ref: refs.setReference })}
        aria-label="구성 옵션 선택"
        className={triggerClassName}
      >
        <span
          className={
            select.selectedItem ? 'font-bold text-[#111]' : 'text-[#767676]'
          }
        >
          {select.selectedItem?.name ?? '옵션 선택'}
        </span>
        <ChevronIcon isOpen={select.isOpen} />
      </button>

      {select.isOpen && (
        <ul
          {...select.getMenuProps({ ref: refs.setFloating })}
          style={floatingStyles}
          className={menuClassName}
        >
          {items.map((item, index) => (
            <li
              key={item.id}
              {...select.getItemProps({ item, index })}
              className="group flex cursor-pointer items-center justify-between bg-white px-5 py-3 text-[15px] data-disabled:cursor-not-allowed data-disabled:opacity-40 data-highlighted:bg-[#f7f7f7]"
            >
              <span className="group-data-selected:font-bold">{item.name}</span>
              <span className="text-[13px] text-[#5a6675]">
                {isSoldOut(item) ? '품절' : `${item.price.toLocaleString()}원`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SelectDemo() {
  const selectOptions = DEMO_SELECT_OPTIONS;

  return (
    <section className="flex flex-col gap-8">
      <h2 className="text-2xl font-bold">Select — Headless</h2>
      <div>
        <p className="mb-2 text-sm text-[#8794a3]">
          1. 사이즈 옵션 · uncontrolled + defaultSelectedItem
        </p>
        <SizeSelectDemo items={selectOptions.sizeOptions} />
      </div>
      <div>
        <p className="mb-2 text-sm text-[#8794a3]">
          2. 썸네일 옵션 · uncontrolled 최소 사용
        </p>
        <ThumbnailSelectDemo items={selectOptions.thumbnailOptions} />
      </div>
      <div>
        <p className="mb-2 text-sm text-[#8794a3]">
          3. 텍스트 옵션 · controlled — 외부 state로 선택값 읽기/초기화
        </p>
        <TextSelectDemo items={selectOptions.textOptions} />
      </div>
      <div>
        <p className="mb-2 text-sm text-[#8794a3]">
          4. 그룹 옵션 · 그룹 라벨/구분 렌더도 사용처 소유 (Radix ‘grouped
          items’)
        </p>
        <GroupedSelectDemo items={selectOptions.colorOptions} />
      </div>
      <div>
        <p className="mb-2 text-sm text-[#8794a3]">
          5. 액션 제어 · openMenu/closeMenu/selectItem 직접 호출 (Downshift
          ‘action props’)
        </p>
        <ActionPropsSelectDemo items={selectOptions.textOptions} />
      </div>
    </section>
  );
}
