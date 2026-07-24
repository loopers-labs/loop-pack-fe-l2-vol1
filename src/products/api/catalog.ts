import { assertProducts, type Product } from "./types";

// mock 백엔드 데이터 소스. 실제 DB 대신 이 카탈로그를 route handler가 그대로 서빙한다.
// 필요하면 자유롭게 늘리거나 구조를 바꿔도 된다.
export const productCatalog: Product[] = [
  {
    id: "p1",
    name: "러닝화",
    optionKind: "size",
    options: [
      { id: "s24", value: 24, deliveryText: "내일(토) 도착보장", stock: 3 },
      { id: "s25", value: 25, deliveryText: "내일(토) 도착보장", stock: 0 },
      { id: "s26", value: 26, deliveryText: "내일(토) 도착보장", stock: 12 },
      { id: "s27", value: 27, deliveryText: "내일(토) 도착보장", stock: 5 },
      { id: "s28", value: 28, deliveryText: "내일(토) 도착보장", stock: 0 },
    ],
  },
  {
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
      {
        id: "t2",
        thumbnail: "/next.svg",
        label: "에브리씽",
        discountRate: 0,
        price: 33800,
        shippingBadge: "오늘드림",
        stock: 4,
      },
    ],
  },
  {
    id: "p3",
    name: "원두 번들",
    optionKind: "bundle",
    options: [
      { id: "b1", label: "10개입", price: 21000, unitPrice: 2100, stock: 9 },
      { id: "b2", label: "1개", price: 4200, unitPrice: 4200, stock: 6 },
    ],
  },
];

// 데이터 정의 오류를 모듈 로드 시점에 즉시 드러내는 자기검증(fail-fast).
assertProducts(productCatalog);
