import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SizeSkin } from "./size-skin";
import { ThumbnailSkin } from "./thumbnail-skin";
import { BundleSkin } from "./bundle-skin";
import type { SizeOption, ThumbnailOption, BundleOption } from "@/products/api/types";

afterEach(cleanup);

// s2 route(mocks/handlers.ts) 데이터와 정합. thumbnail/bundle은 품절(stock 0) 케이스 검증을 위해
// route에 없는 품절 옵션 하나씩만 덧붙인다(readout 예시로 쓰는 t1/t2·b1/b2는 그대로 둔다).
const sizeOptions: SizeOption[] = [
  { id: "s24", value: 24, deliveryText: "내일(토) 도착보장", stock: 3 },
  { id: "s25", value: 25, deliveryText: "내일(토) 도착보장", stock: 0 },
  { id: "s26", value: 26, deliveryText: "내일(토) 도착보장", stock: 12 },
  { id: "s27", value: 27, deliveryText: "내일(토) 도착보장", stock: 5 },
  { id: "s28", value: 28, deliveryText: "내일(토) 도착보장", stock: 0 },
];

const thumbnailOptions: ThumbnailOption[] = [
  {
    id: "t1",
    thumbnail: "/next.svg",
    label: "오리지널",
    discountRate: 2,
    price: 38800,
    shippingBadge: "오늘드림",
    stock: 7,
  },
  {
    id: "t2",
    thumbnail: "/next.svg",
    label: "에브리씽",
    discountRate: 0,
    price: 33800,
    shippingBadge: "오늘드림",
    stock: 4,
  },
  {
    id: "t3",
    thumbnail: "/next.svg",
    label: "품절 옵션",
    discountRate: 0,
    price: 9900,
    shippingBadge: "오늘드림",
    stock: 0,
  },
];

const bundleOptions: BundleOption[] = [
  { id: "b1", label: "10개입", price: 21000, unitPrice: 2100, stock: 9 },
  { id: "b2", label: "1개", price: 4200, unitPrice: 4200, stock: 6 },
  { id: "b3", label: "품절 묶음", price: 1000, unitPrice: 1000, stock: 0 },
];

interface SkinCase {
  skinName: string;
  renderSkin: () => void;
  group: string;
  optionCount: number;
  placeholder: string;
  enabledOptionName: string;
  disabledOptionName: string;
  expectedReadout: string;
}

const cases: SkinCase[] = [
  {
    skinName: "SizeSkin",
    renderSkin: () => render(<SizeSkin options={sizeOptions} />),
    group: "사이즈 선택",
    optionCount: sizeOptions.length,
    placeholder: "사이즈를 선택해 주세요",
    enabledOptionName: "24 · 내일(토) 도착보장",
    disabledOptionName: "25 · 내일(토) 도착보장",
    expectedReadout: "24 · 내일(토) 도착보장",
  },
  {
    skinName: "ThumbnailSkin",
    renderSkin: () => render(<ThumbnailSkin options={thumbnailOptions} />),
    group: "옵션 선택",
    optionCount: thumbnailOptions.length,
    placeholder: "옵션을 선택해 주세요",
    enabledOptionName: "오리지널 · 38,800원 · 2% · 오늘드림",
    disabledOptionName: "품절 옵션 · 9,900원 · 오늘드림",
    expectedReadout: "38,800원 · 2% · 오늘드림",
  },
  {
    skinName: "BundleSkin",
    renderSkin: () => render(<BundleSkin options={bundleOptions} />),
    group: "구성 선택",
    optionCount: bundleOptions.length,
    placeholder: "구성을 선택해 주세요",
    enabledOptionName: "10개입 · 21,000원 · 1개당 2,100원 · 무료배송",
    disabledOptionName: "품절 묶음 · 1,000원 · 1개당 1,000원 · 무료배송",
    expectedReadout: "21,000원 · 1개당 2,100원 · 무료배송",
  },
];

describe.each(cases)(
  "$skinName",
  ({
    renderSkin,
    group,
    optionCount,
    placeholder,
    enabledOptionName,
    disabledOptionName,
    expectedReadout,
  }) => {
    it("옵션이 모두 렌더된다", () => {
      renderSkin();

      expect(screen.getAllByRole("button")).toHaveLength(optionCount);
      expect(screen.getByRole("button", { name: enabledOptionName })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: disabledOptionName })).toBeInTheDocument();
    });

    it("재고 0 옵션은 비활성화되어 선택해도 선택 상태가 바뀌지 않는다", async () => {
      const user = userEvent.setup();
      renderSkin();

      const disabledOption = screen.getByRole("button", { name: disabledOptionName });
      expect(disabledOption).toBeDisabled();

      await user.click(disabledOption);

      expect(screen.getByText(placeholder)).toBeInTheDocument();
    });

    it("옵션을 선택하면 요약 readout이 갱신된다", async () => {
      const user = userEvent.setup();
      renderSkin();

      expect(screen.getByText(placeholder)).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: enabledOptionName }));

      expect(screen.getByText(expectedReadout)).toBeInTheDocument();
    });

    it("컨테이너에서 ArrowDown을 누르면 첫 활성 옵션이 highlight된다", () => {
      renderSkin();

      fireEvent.keyDown(screen.getByRole("group", { name: group }), { key: "ArrowDown" });

      expect(screen.getByRole("button", { name: enabledOptionName })).toHaveAttribute(
        "aria-current",
        "true",
      );
    });
  },
);
