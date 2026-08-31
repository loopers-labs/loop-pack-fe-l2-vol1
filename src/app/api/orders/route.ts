import { NextRequest, NextResponse } from "next/server";
import {
  isAuthScenario,
  readSessionToken,
  waitForAuthApi,
} from "@/app/api/_data/auth";
import { SCENARIO_COOKIE, SESSION_COOKIE } from "@/app/api/_data/auth-cookies";
import { orderRepository } from '@/app/api/_data/orderRepository';
import { getProductById } from '@/app/api/_data/productService';
import type {
  AuthErrorResponse,
  AuthUser,
} from "@/app/api/_data/auth";
import type {
  OrderCreateResponse,
  OrderListResponse,
} from "@/entities/order/model/types";
import { orderCreateRequestSchema } from '@/entities/order/model/types';

type Resolved =
  | { ok: true; user: AuthUser; scenario: string | null }
  | { ok: false; response: NextResponse<AuthErrorResponse> };

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

  await waitForAuthApi(scenario === "slow" ? 1_500 : 500);

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

export async function POST(
  request: NextRequest,
): Promise<NextResponse<OrderCreateResponse | AuthErrorResponse>> {
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

  const requestBody = orderCreateRequestSchema.safeParse(body);
  if (
    !requestBody.success ||
    requestBody.data.items.some(({ productId }) => !getProductById(productId))
  ) {
    return NextResponse.json({ message: "요청 조건을 확인해주세요." }, { status: 400 });
  }

  return NextResponse.json(
    { order: orderRepository.add(resolved.user.id, requestBody.data.items) },
    { status: 201 },
  );
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<OrderListResponse | AuthErrorResponse>> {
  const resolved = await resolveSession(request);
  if (!resolved.ok) {
    return resolved.response;
  }

  return NextResponse.json({ orders: orderRepository.list(resolved.user.id) });
}
