import { http, HttpResponse } from "msw";

import { categories } from "@/app/api/_data/commerce";
import type { Product } from "@/entities/product/model/types";
import type { SessionUser } from "@/entities/session/model/types";
import type { Order } from "@/features/orders/model/types";
import type { ProductListResponse } from "@/features/products/api/queries";

// 픽스처는 여기 한 곳에서만 만든다. 테스트마다 객체 리터럴을 새로 쓰지 않고 이 팩토리를 쓰면,
// 서버 스키마가 바뀔 때 고칠 곳이 한 곳이 된다. 반환 타입에 실제 응답 타입을 붙여,
// 스키마가 어긋나면 테스트 실패보다 먼저 타입 에러로 걸리게 한다.
export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "p1",
    brand: "테스트 브랜드",
    name: "테스트 상품",
    category: "casual",
    price: 10_000,
    originalPrice: null,
    image: "/test.jpg",
    freeShipping: false,
    sizes: [{ value: 0, stock: 10 }],
    rating: 4.5,
    reviewCount: 10,
    createdAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeProductListResponse(
  overrides: Partial<ProductListResponse> = {},
): ProductListResponse {
  return {
    products: [makeProduct()],
    categories,
    totalCount: 1,
    page: 1,
    pageSize: 12,
    ...overrides,
  };
}

// 로그인 응답의 user. 실제 응답 타입(SessionUser)을 붙여 스키마가 어긋나면 타입 에러로 먼저 걸린다.
export function makeSessionUser(overrides: Partial<SessionUser> = {}): SessionUser {
  return { id: "u1", name: "루퍼1", email: "looper1@loopers.dev", ...overrides };
}

// 주문 응답. 실제 응답 타입(Order)을 붙여 스키마가 어긋나면 타입 에러로 먼저 걸린다.
export function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "o1",
    createdAt: "2026-01-01T00:00:00.000Z",
    items: [{ productId: "p1", quantity: 1 }],
    ...overrides,
  };
}

// 기본 핸들러에는 성공 경로만 둔다.
// 실패·지연·빈 결과는 각 테스트에서 server.use()로 덮는다.
export const handlers = [
  http.get("*/api/products", () => HttpResponse.json(makeProductListResponse())),
  http.post("*/api/auth/login", () => HttpResponse.json({ user: makeSessionUser() })),
  http.post("*/api/auth/logout", () => new HttpResponse(null, { status: 204 })),
  http.get("*/api/orders", () => HttpResponse.json({ orders: [makeOrder()] })),
  http.post("*/api/orders", () => HttpResponse.json({ order: makeOrder() }, { status: 201 })),
];
