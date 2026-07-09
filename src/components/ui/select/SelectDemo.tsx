'use client';

import { useEffect, useState } from 'react';

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

type ProductsResponse = {
  selectOptions: {
    sizeOptions: SizeOption[];
    thumbnailOptions: ThumbnailOption[];
    textOptions: TextOption[];
  };
};

const containerClassName =
  'w-100 overflow-hidden border border-[#e0e0e0] bg-white';

const toggleButtonClassName =
  'flex w-full cursor-pointer items-center justify-between px-5 py-4.5 text-base';

function Chevron({ isOpen }: { isOpen: boolean }) {
  return <span className="text-[#555]">{isOpen ? '∧' : '∨'}</span>;
}

// uncontrolled + defaultSelectedItem: hook이 상태를 소유하고 초기 선택값만 넘긴다
function SizeSelectDemo({ items }: { items: SizeOption[] }) {
  const select = useSelect({
    items,
    defaultSelectedItem: items[1],
    itemToKey: (item) => item.id,
    isItemDisabled: (item) => item.stock === 0,
  });

  return (
    <div className={`${containerClassName} rounded-xl`}>
      <button
        type="button"
        {...select.getToggleButtonProps()}
        className={toggleButtonClassName}
      >
        <span className={select.selectedItem ? 'text-[#111]' : 'text-[#888]'}>
          {select.selectedItem?.label ?? '사이즈'}
        </span>
        <Chevron isOpen={select.isOpen} />
      </button>

      {select.isOpen && (
        <ul className="list-none border-t border-[#e0e0e0]">
          {items.map((item, index) => {
            const { selected, highlighted, disabled } = select.getItemState({
              item,
              index,
            });

            return (
              <li
                key={item.id}
                {...select.getItemProps({ item, index })}
                className={`border-b border-[#f2f2f2] px-6 py-4.5 ${
                  disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                } ${highlighted ? 'bg-[#f7f7f7]' : 'bg-white'}`}
              >
                <div
                  className={`text-lg ${selected ? 'font-bold' : 'font-medium'}`}
                >
                  {item.label}
                </div>
                <div
                  className={`mt-2 text-[15px] ${
                    disabled ? 'text-[#888]' : 'text-[#2b4df0]'
                  }`}
                >
                  {disabled ? '품절' : `🚚 ${item.deliveryLabel}`}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// uncontrolled 최소 사용: 필수 파라미터만 넘기고 선택 상태는 전부 hook에 맡긴다
function ThumbnailSelectDemo({ items }: { items: ThumbnailOption[] }) {
  const select = useSelect({
    items,
    itemToKey: (item) => item.id,
    isItemDisabled: (item) => item.stock === 0,
  });

  return (
    <div className={`${containerClassName} rounded-2xl`}>
      <button
        type="button"
        {...select.getToggleButtonProps()}
        className={toggleButtonClassName}
      >
        <span className="font-bold text-[#111]">
          {select.selectedItem?.name ?? '옵션을 선택해 주세요'}
        </span>
        <Chevron isOpen={select.isOpen} />
      </button>

      {select.isOpen && (
        <ul className="list-none border-t border-[#eee]">
          {items.map((item, index) => {
            const { selected, highlighted, disabled } = select.getItemState({
              item,
              index,
            });

            return (
              <li
                key={item.id}
                {...select.getItemProps({ item, index })}
                className={`flex items-center gap-5 border-b border-[#f2f2f2] px-6 py-5 ${
                  disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                } ${highlighted ? 'bg-[#f7f7f7]' : 'bg-white'}`}
              >
                <div
                  className={`h-22 w-16 rounded-md ${
                    selected ? 'outline-2 outline-solid outline-[#111]' : ''
                  }`}
                  style={{ backgroundColor: item.thumbnailColor }}
                />
                <div>
                  <div
                    className={`text-base ${selected ? 'font-bold' : 'font-normal'}`}
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

// controlled: 사용처 state가 source of truth라 밖에서 읽거나 초기화할 수 있다
function TextSelectDemo({ items }: { items: TextOption[] }) {
  const [selectedOption, setSelectedOption] = useState<TextOption | null>(null);

  const select = useSelect({
    items,
    selectedItem: selectedOption,
    onSelectedItemChange: ({ selectedItem }) => setSelectedOption(selectedItem),
    itemToKey: (item) => item.id,
    isItemDisabled: (item) => item.stock === 0,
  });

  return (
    <div className="w-100 rounded-2xl bg-[#f5f0ea] p-4">
      <button
        type="button"
        {...select.getToggleButtonProps()}
        className={`${toggleButtonClassName} rounded-xl bg-white`}
      >
        <span className="font-bold text-[#111]">
          {select.selectedItem?.name ?? '옵션 선택'}
        </span>
        <Chevron isOpen={select.isOpen} />
      </button>

      {select.isOpen && (
        <ul className="mt-3 flex list-none flex-col gap-3">
          {items.map((item, index) => {
            const { selected, highlighted, disabled } = select.getItemState({
              item,
              index,
            });

            return (
              <li
                key={item.id}
                {...select.getItemProps({ item, index })}
                className={`flex items-center justify-between rounded-xl px-5 py-4.5 ${
                  disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                } ${highlighted ? 'bg-[#fbf8f4]' : 'bg-white'} ${
                  selected ? 'outline-2 outline-solid outline-[#f2670d]' : ''
                }`}
              >
                <div>
                  <div className="text-[15px]">{item.name}</div>
                  <div className="mt-2">
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
                    className={`whitespace-nowrap rounded-full border px-3 py-2 text-sm font-bold ${
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
    <section className="mb-8 flex flex-col gap-6">
      <h2 className="text-xl font-bold">Headless Select</h2>
      <div>
        <p className="mb-2 text-sm text-[#8794a3]">
          uncontrolled · defaultSelectedItem으로 초기 선택 제공
        </p>
        <SizeSelectDemo items={selectOptions.sizeOptions} />
      </div>
      <div>
        <p className="mb-2 text-sm text-[#8794a3]">uncontrolled · 최소 사용</p>
        <ThumbnailSelectDemo items={selectOptions.thumbnailOptions} />
      </div>
      <div>
        <p className="mb-2 text-sm text-[#8794a3]">
          controlled · 외부 state로 선택값 읽기/초기화
        </p>
        <TextSelectDemo items={selectOptions.textOptions} />
      </div>
    </section>
  );
}
