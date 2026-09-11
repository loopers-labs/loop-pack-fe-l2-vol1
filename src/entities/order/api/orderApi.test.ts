import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { server } from "@/shared/config/vitest/mswServer";
import { createOrder, getOrders } from "./orderApi";

const TEST_API_ORIGIN = "http://test.local";

describe("orderApi", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("주문 생성은 장바구니 상품 id와 수량을 전송하고 생성된 주문을 반환한다", async () => {
    vi.stubEnv("APP_ORIGIN", TEST_API_ORIGIN);
    let requestBody: unknown;
    server.use(
      http.post(`${TEST_API_ORIGIN}/api/orders`, async ({ request }) => {
        requestBody = await request.json();

        return HttpResponse.json(
          {
            order: {
              id: "o1",
              createdAt: "2026-08-29T00:00:00.000Z",
              items: [{ productId: "p1", quantity: 2 }],
            },
          },
          { status: 201 },
        );
      }),
    );

    await expect(
      createOrder({
        items: [{ productId: "p1", quantity: 2 }],
      }),
    ).resolves.toEqual({
      order: {
        id: "o1",
        createdAt: "2026-08-29T00:00:00.000Z",
        items: [{ productId: "p1", quantity: 2 }],
      },
    });
    expect(requestBody).toEqual({
      items: [{ productId: "p1", quantity: 2 }],
    });
  });

  it("주문 생성 실패 응답은 API 메시지로 에러를 반환한다", async () => {
    vi.stubEnv("APP_ORIGIN", TEST_API_ORIGIN);
    server.use(
      http.post(`${TEST_API_ORIGIN}/api/orders`, () =>
        HttpResponse.json({ message: "요청 조건을 확인해주세요." }, { status: 400 }),
      ),
    );

    await expect(createOrder({ items: [] })).rejects.toThrow("요청 조건을 확인해주세요.");
  });

  it("주문 내역 조회는 완료한 주문 목록을 반환한다", async () => {
    vi.stubEnv("APP_ORIGIN", TEST_API_ORIGIN);
    server.use(
      http.get(`${TEST_API_ORIGIN}/api/orders`, () =>
        HttpResponse.json({
          orders: [
            {
              id: "o1",
              createdAt: "2026-08-29T00:00:00.000Z",
              items: [{ productId: "p1", quantity: 2 }],
            },
          ],
        }),
      ),
    );

    await expect(getOrders()).resolves.toEqual({
      orders: [
        {
          id: "o1",
          createdAt: "2026-08-29T00:00:00.000Z",
          items: [{ productId: "p1", quantity: 2 }],
        },
      ],
    });
  });

  it("주문 내역 조회 실패 응답은 API 메시지로 에러를 반환한다", async () => {
    vi.stubEnv("APP_ORIGIN", TEST_API_ORIGIN);
    server.use(
      http.get(`${TEST_API_ORIGIN}/api/orders`, () =>
        HttpResponse.json({ message: "주문 내역을 불러오지 못했습니다." }, { status: 500 }),
      ),
    );

    await expect(getOrders()).rejects.toThrow("주문 내역을 불러오지 못했습니다.");
  });
});
