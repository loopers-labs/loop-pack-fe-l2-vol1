'use client';

import {
  autoUpdate,
  flip,
  offset,
  size,
  useFloating,
} from '@floating-ui/react';
import { Fragment, useEffect, useState } from 'react';

import { useSelect } from '@/components/ui/select/useSelect';

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

type ProductsResponse = {
  selectOptions: {
    sizeOptions: SizeOption[];
    thumbnailOptions: ThumbnailOption[];
    textOptions: TextOption[];
    colorOptions: ColorOption[];
  };
};

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
    isItemDisabled: (item) => item.stock === 0,
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
          {items.map((item, index) => {
            const { selected, highlighted, disabled } = select.getItemState({
              item,
              index,
            });

            return (
              <li
                key={item.id}
                {...select.getItemProps({ item, index })}
                className={`border-b border-[#f2f2f2] px-6 py-4 last:border-b-0 ${
                  disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                } ${highlighted ? 'bg-[#f7f7f7]' : 'bg-white'}`}
              >
                <div
                  className={`text-lg ${selected ? 'font-bold' : 'font-medium'}`}
                >
                  {item.label}
                </div>
                <div
                  className={`mt-1.5 flex items-center gap-1.5 text-[15px] ${
                    disabled ? 'text-[#888]' : 'text-[#2b4df0]'
                  }`}
                >
                  {disabled ? (
                    '품절'
                  ) : (
                    <>
                      <TruckIcon />
                      {item.deliveryLabel}
                    </>
                  )}
                </div>
              </li>
            );
          })}
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
    isItemDisabled: (item) => item.stock === 0,
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
          {items.map((item, index) => {
            const { selected, highlighted, disabled } = select.getItemState({
              item,
              index,
            });

            return (
              <li
                key={item.id}
                {...select.getItemProps({ item, index })}
                className={`flex items-center gap-5 border-b border-[#f5f5f5] px-6 py-5 last:border-b-0 ${
                  disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                } ${highlighted ? 'bg-[#f7f7f7]' : 'bg-white'}`}
              >
                <div
                  className={`h-22 w-16 shrink-0 rounded-md ${
                    selected ? 'outline-2 outline-solid outline-[#111]' : ''
                  }`}
                  style={{ backgroundColor: item.thumbnailColor }}
                />
                <div className="min-w-0">
                  <div
                    className={`truncate text-base ${selected ? 'font-bold' : 'font-normal'}`}
                  >
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
                        disabled
                          ? 'bg-[#f0f0f0] text-[#888]'
                          : 'bg-[#fceef1] text-[#f04e6e]'
                      }`}
                    >
                      {disabled ? '품절' : item.badgeLabel}
                    </span>
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

// 이미지 3 (텍스트 옵션) — controlled: 사용처 state가 source of truth라 밖에서 읽거나 초기화할 수 있다
function TextSelectDemo({ items }: { items: TextOption[] }) {
  const [selectedOption, setSelectedOption] = useState<TextOption | null>(null);

  const select = useSelect({
    items,
    selectedItem: selectedOption,
    onSelectedItemChange: ({ selectedItem }) => setSelectedOption(selectedItem),
    itemToKey: (item) => item.id,
    isItemDisabled: (item) => item.stock === 0,
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
          {items.map((item, index) => {
            const { selected, highlighted, disabled } = select.getItemState({
              item,
              index,
            });

            return (
              <li
                key={item.id}
                {...select.getItemProps({ item, index })}
                className={`flex items-center justify-between gap-4 border-b border-[#f2f2f2] px-5 py-4.5 last:border-b-0 ${
                  disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                } ${highlighted ? 'bg-[#f7f7f7]' : 'bg-white'}`}
              >
                <div>
                  <div
                    className={`text-[15px] text-[#111] ${selected ? 'font-bold' : ''}`}
                  >
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
                {(disabled || item.badgeLabel) && (
                  <span
                    className={`whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-bold ${
                      disabled
                        ? 'border-[#bbb] text-[#888]'
                        : 'border-[#f2670d] text-[#f2670d]'
                    }`}
                  >
                    {disabled ? '품절' : item.badgeLabel}
                  </span>
                )}
              </li>
            );
          })}
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
    isItemDisabled: (item) => item.stock === 0,
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
            const { selected, highlighted, disabled } = select.getItemState({
              item,
              index,
            });
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
                  className={`flex items-center gap-3 px-5 py-2.5 text-[15px] ${
                    disabled
                      ? 'cursor-not-allowed opacity-40'
                      : 'cursor-pointer'
                  } ${highlighted ? 'bg-[#f7f7f7]' : 'bg-white'}`}
                >
                  <span
                    className="h-5 w-5 shrink-0 rounded-full border border-black/10"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className={selected ? 'font-bold' : ''}>
                    {item.name}
                  </span>
                  {disabled && (
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
    isItemDisabled: (item) => item.stock === 0,
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
          {items.map((item, index) => {
            const { selected, highlighted, disabled } = select.getItemState({
              item,
              index,
            });

            return (
              <li
                key={item.id}
                {...select.getItemProps({ item, index })}
                className={`flex items-center justify-between px-5 py-3 text-[15px] ${
                  disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                } ${highlighted ? 'bg-[#f7f7f7]' : 'bg-white'}`}
              >
                <span className={selected ? 'font-bold' : ''}>{item.name}</span>
                <span className="text-[13px] text-[#5a6675]">
                  {disabled ? '품절' : `${item.price.toLocaleString()}원`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function SelectDemo() {
  const [selectOptions, setSelectOptions] = useState<
    ProductsResponse['selectOptions'] | null
  >(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/products')
      .then((response) => {
        if (!response.ok) {
          throw new Error('products 조회 실패');
        }

        return response.json();
      })
      .then((body: ProductsResponse) => {
        if (!cancelled) {
          setSelectOptions(body.selectOptions);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (isError) {
    return <p>옵션을 불러오지 못했어요. 새로고침 후 다시 시도해 주세요.</p>;
  }

  if (selectOptions === null) {
    return <p>옵션을 불러오는 중…</p>;
  }

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
