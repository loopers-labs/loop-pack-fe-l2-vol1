"use client";

import Image from "next/image";
import { useSelect } from "@/shared/ui/select/useSelect";

type BundleOption = {
  id: string;
  title: string;
  price: number;
  unitPrice: number;
  badge?: string;
  disabled?: boolean;
};

type SizeOption = {
  id: string;
  size: number;
  deliveryText: string;
  disabled?: boolean;
};

type ThumbnailOption = {
  id: string;
  name: string;
  image: string;
  discountRate: number;
  price: number;
  badge?: string;
  disabled?: boolean;
};

type DisabledExampleOption = {
  id: string;
  label: string;
  description: string;
  disabled?: boolean;
};

const bundleOptions: BundleOption[] = [
  {
    id: "bundle-10",
    title: "[최대할인] 베이글 5+5개",
    price: 21000,
    unitPrice: 2100,
    badge: "무료배송",
  },
  {
    id: "single-1",
    title: "베이글 1개",
    price: 4200,
    unitPrice: 4200,
  },
];

const sizeOptions: SizeOption[] = [
  {
    id: "size-24",
    size: 24,
    deliveryText: "내일(토) 도착보장",
  },
  {
    id: "size-25",
    size: 25,
    deliveryText: "내일(토) 도착보장",
  },
  {
    id: "size-26",
    size: 26,
    deliveryText: "내일(토) 도착보장",
  },
  {
    id: "size-27",
    size: 27,
    deliveryText: "내일(토) 도착보장",
  },
  {
    id: "size-28",
    size: 28,
    deliveryText: "품절",
    disabled: true,
  },
];

const thumbnailOptions: ThumbnailOption[] = [
  {
    id: "ampoule-100",
    name: "그로우턴 앰플 100ml기획(+100ml)",
    image: "/next.svg",
    discountRate: 2,
    price: 38800,
    badge: "오늘드림",
  },
  {
    id: "ampoule-130",
    name: "그로우턴 앰플 130ml기획(+30ml)",
    image: "/next.svg",
    discountRate: 2,
    price: 33800,
    badge: "오늘드림",
  },
];

const disabledExampleOptions: DisabledExampleOption[] = [
  {
    id: "today",
    label: "오늘 출고",
    description: "오후 2시 전 주문 시 당일 출고",
  },
  {
    id: "dawn",
    label: "새벽 배송",
    description: "현재 배송지에서는 지원하지 않음",
    disabled: true,
  },
  {
    id: "pickup",
    label: "매장 픽업",
    description: "선택한 상품은 픽업 준비 중",
    disabled: true,
  },
  {
    id: "standard",
    label: "일반 배송",
    description: "영업일 기준 2-3일 도착",
  },
];

const formatPrice = (price: number) => {
  return `${price.toLocaleString()}원`;
};

export function SelectExamples() {
  return (
    <section>
      <DemoHeader />
      <div className="grid gap-6 md:grid-cols-2">
        <TextOptionSelect />
        <SizeOptionSelect />
        <ThumbnailOptionSelect />
        <DisabledOptionSelect />
      </div>
      <SelectSpecNote />
    </section>
  );
}

function DemoHeader() {
  return (
    <div className="mb-6">
      <p className="text-[13px] font-semibold text-[#009E30]">Headless Select Demo</p>
      <h1 className="mt-1 text-[24px] font-extrabold tracking-[-0.02em] text-[#191919]">
        같은 로직으로 옵션 UI 3종과 비활성 상태 렌더링
      </h1>
      <p className="mt-2 max-w-[680px] text-[13px] leading-6 text-[#767676]">
        `useSelect`는 선택 상태와 이벤트만 제공하고, 텍스트형·사이즈형·썸네일형 옵션과 선택 불가
        상태의 생김새는 사용처에서 직접 그립니다.
      </p>
    </div>
  );
}

function TextOptionSelect() {
  const select = useSelect({
    items: bundleOptions,
    getItemKey: (item) => item?.id,
    defaultSelectedItem: bundleOptions[0],
    isItemDisabled: (item) => item.disabled === true,
  });

  return (
    <SelectCard title="텍스트 옵션">
      <div className="relative" {...select.getRootProps()}>
        <button className={textTriggerClassName} {...select.getToggleButtonProps()}>
          <span className="min-w-0 flex-1 truncate">
            {select.selectedItem?.title ?? "옵션 선택"}
          </span>
          <ChevronIcon isOpen={select.isOpen} />
        </button>
        {select.isOpen && (
          <ul className={textPanelClassName} {...select.getMenuProps()}>
            {bundleOptions.map((option, index) => {
              const state = select.getItemState({ item: option, index });

              return (
                <li
                  key={option.id}
                  className={getTextOptionClassName(state)}
                  {...select.getItemProps({ item: option, index })}
                >
                  <div className="min-w-0">
                    <p className="text-[16px] font-semibold text-[#191919]">{option.title}</p>
                    <p className="mt-2 text-[21px] font-extrabold text-[#191919]">
                      {formatPrice(option.price)}
                      <span className="ml-2 text-[16px] font-medium text-[#FF3D00]">
                        (1개당 {formatPrice(option.unitPrice)})
                      </span>
                    </p>
                  </div>
                  {option.badge && (
                    <span className="ml-4 shrink-0 rounded-full border border-[#FF3D00] px-3 py-1 text-[13px] font-bold text-[#FF3D00]">
                      {option.badge}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </SelectCard>
  );
}

function SizeOptionSelect() {
  const select = useSelect({
    items: sizeOptions,
    getItemKey: (item) => item?.id,
    defaultSelectedItem: sizeOptions[0],
    isItemDisabled: (item) => item.disabled === true,
  });

  return (
    <SelectCard title="사이즈 옵션">
      <div className="relative" {...select.getRootProps()}>
        <button className={sizeTriggerClassName} {...select.getToggleButtonProps()}>
          <span className="min-w-0 flex-1 truncate">
            {select.selectedItem ? `${select.selectedItem.size}` : "사이즈"}
          </span>
          <ChevronIcon isOpen={select.isOpen} muted />
        </button>
        {select.isOpen && (
          <ul className={sizePanelClassName} {...select.getMenuProps()}>
            {sizeOptions.map((option, index) => {
              const state = select.getItemState({ item: option, index });

              return (
                <li
                  key={option.id}
                  className={getSizeOptionClassName(state)}
                  {...select.getItemProps({ item: option, index })}
                >
                  <p className="text-[20px] font-medium text-[#191919]">{option.size}</p>
                  <p className="mt-2 text-[17px] font-medium text-[#1E5BFF]">
                    <DeliveryIcon />
                    {option.deliveryText}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </SelectCard>
  );
}

function ThumbnailOptionSelect() {
  const select = useSelect({
    items: thumbnailOptions,
    getItemKey: (item) => item?.id,
    defaultSelectedItem: thumbnailOptions[0],
    isItemDisabled: (item) => item.disabled === true,
  });

  return (
    <SelectCard title="썸네일 옵션">
      <div className="relative" {...select.getRootProps()}>
        <button className={thumbnailTriggerClassName} {...select.getToggleButtonProps()}>
          <span className="min-w-0 flex-1 truncate">
            {select.selectedItem?.name ?? "옵션을 선택해 주세요"}
          </span>
          <ChevronIcon isOpen={select.isOpen} />
        </button>
        {select.isOpen && (
          <ul className={thumbnailPanelClassName} {...select.getMenuProps()}>
            {thumbnailOptions.map((option, index) => {
              const state = select.getItemState({ item: option, index });

              return (
                <li
                  key={option.id}
                  className={getThumbnailOptionClassName(state)}
                  {...select.getItemProps({ item: option, index })}
                >
                  <span className="flex h-[86px] w-[60px] shrink-0 items-center justify-center bg-[#F5F5F6]">
                    <Image src={option.image} alt="" width={34} height={34} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[19px] font-medium text-[#191919]">
                      {option.name}
                    </span>
                    <span className="mt-2 flex items-center gap-2">
                      <span className="text-[19px] font-extrabold text-[#FF4B4B]">
                        {option.discountRate}%
                      </span>
                      <span className="text-[21px] font-extrabold text-[#191919]">
                        {formatPrice(option.price)}
                      </span>
                      {option.badge && (
                        <span className="rounded-[4px] bg-[#F5F5F6] px-2 py-1 text-[13px] font-medium text-[#FF4B8B]">
                          {option.badge}
                        </span>
                      )}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </SelectCard>
  );
}

function DisabledOptionSelect() {
  const select = useSelect({
    items: disabledExampleOptions,
    getItemKey: (item) => item?.id,
    defaultSelectedItem: disabledExampleOptions[0],
    isItemDisabled: (item) => item.disabled === true,
  });

  return (
    <SelectCard title="비활성 옵션">
      <div className="relative" {...select.getRootProps()}>
        <button className={disabledTriggerClassName} {...select.getToggleButtonProps()}>
          <span className="min-w-0 flex-1 truncate">
            {select.selectedItem?.label ?? "배송 방식 선택"}
          </span>
          <ChevronIcon isOpen={select.isOpen} />
        </button>
        {select.isOpen && (
          <ul className={disabledPanelClassName} {...select.getMenuProps()}>
            {disabledExampleOptions.map((option, index) => {
              const state = select.getItemState({ item: option, index });

              return (
                <li
                  key={option.id}
                  className={getDisabledOptionClassName(state)}
                  {...select.getItemProps({ item: option, index })}
                >
                  <span className="min-w-0">
                    <span className="block text-[16px] font-semibold">{option.label}</span>
                    <span className="mt-1 block text-[13px] font-medium">{option.description}</span>
                  </span>
                  {state.disabled && (
                    <span className="ml-4 shrink-0 rounded-full bg-[#EFEFEF] px-3 py-1 text-[12px] font-bold text-[#9A9A9A]">
                      선택 불가
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </SelectCard>
  );
}

function SelectCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="rounded-[16px] border border-[#E1E1E1] bg-white p-4 shadow-[0_4px_16px_rgba(25,25,25,0.04)]">
      <h2 className="mb-3 text-[14px] font-bold text-[#4B4B4B]">{title}</h2>
      {children}
    </article>
  );
}

function SelectSpecNote() {
  return (
    <div className="mt-12 rounded-[14px] border border-[#E1E1E1] bg-white px-6 py-5">
      <h2 className="text-[15px] font-bold text-[#191919]">완료조건 확인</h2>
      <p className="mt-1 text-[12.5px] leading-6 text-[#767676]">
        세 가지 완료조건 Select는 같은 `useSelect` 훅을 사용하지만 option 렌더링만 다르게
        구성했습니다. 비활성 예시는 disabled 옵션이 클릭과 키보드 선택에서 제외되는지 함께 확인하기
        위해 추가했습니다.
      </p>
    </div>
  );
}

const triggerBaseClassName =
  "flex h-[64px] w-full items-center justify-between gap-4 rounded-[12px] border border-[#DCDCDC] bg-white px-5 text-left outline-none transition hover:border-[#C7C7C7] focus-visible:border-[#191919] focus-visible:shadow-[0_0_0_3px_rgba(25,25,25,0.08)]";

const panelBaseClassName =
  "absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-[420px] overflow-y-auto rounded-[12px] border border-[#DCDCDC] bg-white shadow-[0_12px_28px_rgba(25,25,25,0.12),0_2px_6px_rgba(25,25,25,0.06)]";

const textTriggerClassName = `${triggerBaseClassName} text-[18px] font-extrabold text-[#191919]`;

const textPanelClassName = `${panelBaseClassName} overflow-hidden`;

const sizeTriggerClassName = `${triggerBaseClassName} text-[20px] font-semibold text-[#191919]`;

const sizePanelClassName = panelBaseClassName;

const thumbnailTriggerClassName = `${triggerBaseClassName} h-[72px] text-[18px] font-semibold text-[#191919]`;

const thumbnailPanelClassName = `${panelBaseClassName} px-5 py-2`;

const disabledTriggerClassName = `${triggerBaseClassName} text-[18px] font-semibold text-[#191919]`;

const disabledPanelClassName = `${panelBaseClassName} p-2`;

function getTextOptionClassName(state: {
  selected: boolean;
  highlighted: boolean;
  disabled: boolean;
}) {
  const classNames = [
    "flex min-h-[108px] cursor-pointer items-center justify-between border-t border-[#EFEFEF] px-5 py-5 outline-none transition first:border-t-0",
    getOptionStateClassName(state),
  ];

  return classNames.filter(Boolean).join(" ");
}

function getSizeOptionClassName(state: {
  selected: boolean;
  highlighted: boolean;
  disabled: boolean;
}) {
  const classNames = [
    "min-h-[104px] cursor-pointer border-t border-[#EFEFEF] px-5 py-5 outline-none transition first:border-t-0",
    getOptionStateClassName(state),
  ];

  return classNames.filter(Boolean).join(" ");
}

function getThumbnailOptionClassName(state: {
  selected: boolean;
  highlighted: boolean;
  disabled: boolean;
}) {
  const classNames = [
    "flex cursor-pointer items-center gap-5 border-t border-[#EFEFEF] py-5 outline-none transition first:border-t-0",
    getOptionStateClassName(state),
  ];

  return classNames.filter(Boolean).join(" ");
}

function getDisabledOptionClassName(state: {
  selected: boolean;
  highlighted: boolean;
  disabled: boolean;
}) {
  const classNames = [
    "flex min-h-[76px] cursor-pointer items-center justify-between rounded-[8px] px-4 py-3 outline-none transition",
    getOptionStateClassName(state),
  ];

  return classNames.filter(Boolean).join(" ");
}

function getOptionStateClassName(state: {
  selected: boolean;
  highlighted: boolean;
  disabled: boolean;
}) {
  if (state.disabled) {
    return "cursor-not-allowed bg-[#F5F5F6] text-[#A0A0A0] opacity-55";
  }

  if (state.highlighted && state.selected) {
    return "bg-[#F0FFF4] text-[#009E30] shadow-[inset_3px_0_0_#00C73C]";
  }

  if (state.highlighted) {
    return "bg-[#F7F7F8] shadow-[inset_3px_0_0_#191919]";
  }

  if (state.selected) {
    return "bg-[#E6FBEC] text-[#009E30]";
  }

  return "text-[#191919]";
}

function ChevronIcon({ isOpen, muted = false }: { isOpen: boolean; muted?: boolean }) {
  return (
    <svg
      className={`h-6 w-6 shrink-0 transition ${isOpen ? "rotate-180" : ""} ${
        muted ? "text-[#8A8A8A]" : "text-[#191919]"
      }`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M6 15l6-6 6 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
    </svg>
  );
}

function DeliveryIcon() {
  return (
    <svg className="mr-1 inline h-5 w-5 align-[-3px]" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 15V7h10v8M14 10h3l3 3v2h-2M7 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM17 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM9 15h6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}
