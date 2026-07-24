import { describe, expect, it } from "vitest";
import { assertProducts, type Product } from "./types";

describe("assertProducts", () => {
  const validProducts: Product[] = [
    {
      id: "p1",
      name: "사이즈 선택 상품",
      optionKind: "size",
      options: [
        { id: "s24", value: 24, deliveryText: "내일(토) 도착보장", stock: 5 },
        { id: "s25", value: 25, deliveryText: "내일(토) 도착보장", stock: 0 },
      ],
    },
    {
      id: "p2",
      name: "썸네일 선택 상품",
      optionKind: "thumbnail",
      options: [
        {
          id: "t1",
          thumbnail: "https://example.com/t1.jpg",
          label: "그로우턴 앰플 100ml기획(+100ml)",
          discountRate: 2,
          price: 38800,
          shippingBadge: "오늘드림",
          stock: 10,
        },
      ],
    },
    {
      id: "p3",
      name: "묶음 선택 상품",
      optionKind: "bundle",
      options: [
        { id: "b1", label: "[최대할인] 베이글 5+5개", price: 21000, unitPrice: 2100, stock: 3 },
        { id: "b2", label: "베이글 1개", price: 4200, unitPrice: 4200, stock: 8 },
      ],
    },
  ];

  it("유효한 size·thumbnail·bundle Product 배열이면 통과한다", () => {
    expect(() => assertProducts(validProducts)).not.toThrow();
  });

  it("최상위 입력이 배열이 아니면 던진다", () => {
    expect(() => assertProducts({})).toThrow();
  });

  it("size 옵션에 value가 없으면 던진다", () => {
    const invalid = [
      {
        id: "p1",
        name: "사이즈 선택 상품",
        optionKind: "size",
        options: [{ id: "s24", deliveryText: "내일(토) 도착보장", stock: 5 }],
      },
    ];

    expect(() => assertProducts(invalid)).toThrow();
  });

  it("thumbnail 옵션에 price가 없으면 던진다", () => {
    const invalid = [
      {
        id: "p2",
        name: "썸네일 선택 상품",
        optionKind: "thumbnail",
        options: [
          {
            id: "t1",
            thumbnail: "https://example.com/t1.jpg",
            label: "그로우턴 앰플",
            discountRate: 2,
            shippingBadge: "오늘드림",
            stock: 10,
          },
        ],
      },
    ];

    expect(() => assertProducts(invalid)).toThrow();
  });

  it("bundle 옵션에 unitPrice가 없으면 던진다", () => {
    const invalid = [
      {
        id: "p3",
        name: "묶음 선택 상품",
        optionKind: "bundle",
        options: [{ id: "b1", label: "베이글 1개", price: 4200, stock: 8 }],
      },
    ];

    expect(() => assertProducts(invalid)).toThrow();
  });

  it("옵션에 id가 없으면 던진다", () => {
    const invalid = [
      {
        id: "p1",
        name: "사이즈 선택 상품",
        optionKind: "size",
        options: [{ value: 24, deliveryText: "내일(토) 도착보장", stock: 5 }],
      },
    ];

    expect(() => assertProducts(invalid)).toThrow();
  });

  it("알 수 없는 optionKind면 던진다", () => {
    const invalid = [
      {
        id: "p1",
        name: "알 수 없는 상품",
        optionKind: "color",
        options: [],
      },
    ];

    expect(() => assertProducts(invalid)).toThrow();
  });
});
