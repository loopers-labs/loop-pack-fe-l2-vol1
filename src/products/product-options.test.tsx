import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ProductOptions } from "./product-options";
import type { Product } from "@/products/api/types";

afterEach(cleanup);

// s2 route(src/mocks/handlers.ts)의 p1(size)/p2(thumbnail)/p3(bundle)와 정합.
const sizeProduct: Product = {
  id: "p1",
  name: "러닝화",
  optionKind: "size",
  options: [
    { id: "s24", value: 24, deliveryText: "내일(토) 도착보장", stock: 3 },
    { id: "s25", value: 25, deliveryText: "내일(토) 도착보장", stock: 0 },
  ],
};

const thumbnailProduct: Product = {
  id: "p2",
  name: "베이글 세트",
  optionKind: "thumbnail",
  options: [
    {
      id: "t1",
      thumbnail: "/next.svg",
      label: "오리지널",
      discountRate: 2,
      price: 38800,
      shippingBadge: "오늘드림",
      stock: 7,
    },
  ],
};

const bundleProduct: Product = {
  id: "p3",
  name: "원두 번들",
  optionKind: "bundle",
  options: [{ id: "b1", label: "10개입", price: 21000, unitPrice: 2100, stock: 9 }],
};

describe("ProductOptions", () => {
  it("optionKind가 size인 Product를 넘기면 SizeSkin이 렌더된다", () => {
    render(<ProductOptions product={sizeProduct} />);

    expect(screen.getByRole("group", { name: "사이즈 선택" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "24 · 내일(토) 도착보장" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "옵션 선택" })).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "구성 선택" })).not.toBeInTheDocument();
  });

  it("optionKind가 thumbnail인 Product를 넘기면 ThumbnailSkin이 렌더된다", () => {
    render(<ProductOptions product={thumbnailProduct} />);

    expect(screen.getByRole("group", { name: "옵션 선택" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "오리지널 · 38,800원 · 2% · 오늘드림" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "사이즈 선택" })).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "구성 선택" })).not.toBeInTheDocument();
  });

  it("optionKind가 bundle인 Product를 넘기면 BundleSkin이 렌더된다", () => {
    render(<ProductOptions product={bundleProduct} />);

    expect(screen.getByRole("group", { name: "구성 선택" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "10개입 · 21,000원 · 1개당 2,100원 · 무료배송" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "사이즈 선택" })).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "옵션 선택" })).not.toBeInTheDocument();
  });
});
