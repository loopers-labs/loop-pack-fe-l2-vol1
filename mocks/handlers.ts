import { NextRequest } from "next/server";
import { http, HttpResponse } from "msw";
import { GET as getProducts } from "../app/api/products/route";
import { GET as getHome } from "../app/api/home/route";

// /api/product-options route.ts와 동일 shape·값을 인라인으로 독립 복제한다.
// mocks/가 src/ 밖에 있어 depcruise(no-cross-feature)의 src/products import 금지가
// 더는 적용되지 않지만, get-products.test.ts:10이 이 3개 Product 픽스처를 그대로
// 기대하므로 위임(route.ts 재사용) 전환은 이번 범위에서 다루지 않는다.
const products = [
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

export const handlers = [
  http.get("/api/product-options", () => {
    return HttpResponse.json({ products, totalCount: products.length });
  }),
  // 검증·정렬·페이지네이션 로직은 route.ts의 GET 하나에만 존재해야 한다 —
  // 여기서 응답을 합성하면 로직이 갈라져도 테스트가 통과하는 채로 남는다.
  http.get("/api/products", ({ request }) => getProducts(new NextRequest(request.url))),
  http.get("/api/home", ({ request }) => getHome(new NextRequest(request.url))),
];
