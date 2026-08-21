import { NextRequest, NextResponse } from "next/server";
import { waitForMockApi } from "@/app/api/_data/commerce";
import {
  addOrder,
  isAuthScenario,
  isKnownProductId,
  listOrders,
  readSessionToken,
  SCENARIO_COOKIE,
  SESSION_COOKIE,
} from "@/app/api/_data/auth";
import type { ApiErrorResponse } from "@/types/commerce";
import type {
  AuthUser,
  OrderCreateResponse,
  OrderItem,
  OrderListResponse,
} from "@/types/auth";

type Resolved =
  | { ok: true; user: AuthUser; scenario: string | null }
  | { ok: false; response: NextResponse<ApiErrorResponse> };

const resolveSession = async (request: NextRequest): Promise<Resolved> => {
  const scenario =
    request.nextUrl.searchParams.get("scenario") ??
    request.cookies.get(SCENARIO_COOKIE)?.value ??
    null;

  if (scenario !== null && !isAuthScenario(scenario)) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "요청 조건을 확인해주세요." },
        { status: 400 },
      ),
    };
  }

  await waitForMockApi(scenario === "slow" ? 1_500 : 500);

  if (scenario === "error") {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "주문 정보를 처리하지 못했습니다." },
        { status: 500 },
      ),
    };
  }

  const user =
    scenario === "expired"
      ? null
      : readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (user === null) {
    return {
      ok: false,
      response: NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 }),
    };
  }

  return { ok: true, user, scenario };
};

const parseItems = (value: unknown): OrderItem[] | null => {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const items: OrderItem[] = [];
  for (const entry of value) {
    const { productId, quantity } = (entry ?? {}) as Record<string, unknown>;
    if (typeof productId !== "string" || !isKnownProductId(productId)) {
      return null;
    }
    if (typeof quantity !== "number" || !Number.isSafeInteger(quantity) || quantity < 1) {
      return null;
    }
    items.push({ productId, quantity });
  }

  return items;
};

export async function POST(
  request: NextRequest,
): Promise<NextResponse<OrderCreateResponse | ApiErrorResponse>> {
  const resolved = await resolveSession(request);
  if (!resolved.ok) {
    return resolved.response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "요청 조건을 확인해주세요." }, { status: 400 });
  }

  const items = parseItems((body as Record<string, unknown> | null)?.items);
  if (items === null) {
    return NextResponse.json({ message: "요청 조건을 확인해주세요." }, { status: 400 });
  }

  return NextResponse.json({ order: addOrder(resolved.user.id, items) }, { status: 201 });
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<OrderListResponse | ApiErrorResponse>> {
  const resolved = await resolveSession(request);
  if (!resolved.ok) {
    return resolved.response;
  }

  return NextResponse.json({ orders: listOrders(resolved.user.id) });
}
