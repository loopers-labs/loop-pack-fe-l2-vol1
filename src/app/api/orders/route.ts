import { NextResponse, type NextRequest } from 'next/server';
import {
  addOrder,
  isAuthScenario,
  isKnownProductId,
  isRecord,
  listOrders,
  readSessionToken,
  waitForAuthApi,
} from '@/app/api/_data/auth';
import { SCENARIO_COOKIE, SESSION_COOKIE } from '@/shared/config/session';
import type { AuthErrorResponse, AuthUser } from '@/entities/session/model/session';
import type {
  OrderCreateResponse,
  OrderItem,
  OrderListResponse,
} from '@/entities/order/model/order';

type Resolved =
  | { ok: true; user: AuthUser; scenario: string | null }
  | { ok: false; response: NextResponse<AuthErrorResponse> };

const resolveSession = async (request: NextRequest): Promise<Resolved> => {
  const scenario =
    request.nextUrl.searchParams.get('scenario') ??
    request.cookies.get(SCENARIO_COOKIE)?.value ??
    null;

  if (scenario !== null && !isAuthScenario(scenario)) {
    return {
      ok: false,
      response: NextResponse.json({ message: '요청 조건을 확인해주세요.' }, { status: 400 }),
    };
  }

  await waitForAuthApi(scenario === 'slow' ? 1_500 : 500);

  if (scenario === 'error') {
    return {
      ok: false,
      response: NextResponse.json({ message: '주문 정보를 처리하지 못했습니다.' }, { status: 500 }),
    };
  }

  const user =
    scenario === 'expired' ? null : readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (user === null) {
    return {
      ok: false,
      response: NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 }),
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
    if (!isRecord(entry)) {
      return null;
    }

    const { productId, quantity } = entry;
    if (typeof productId !== 'string' || !isKnownProductId(productId)) {
      return null;
    }
    if (typeof quantity !== 'number' || !Number.isSafeInteger(quantity) || quantity < 1) {
      return null;
    }
    items.push({ productId, quantity });
  }

  return items;
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
    return NextResponse.json({ message: '요청 조건을 확인해주세요.' }, { status: 400 });
  }

  const items = isRecord(body) ? parseItems(body.items) : null;
  if (items === null) {
    return NextResponse.json({ message: '요청 조건을 확인해주세요.' }, { status: 400 });
  }

  return NextResponse.json({ order: addOrder(resolved.user.id, items) }, { status: 201 });
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<OrderListResponse | AuthErrorResponse>> {
  const resolved = await resolveSession(request);
  if (!resolved.ok) {
    return resolved.response;
  }

  return NextResponse.json({ orders: listOrders(resolved.user.id) });
}
