import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it } from 'vitest';
import { accounts, createSessionToken, resetOrders } from '@/app/api/_data/auth';
import { SCENARIO_COOKIE, SESSION_COOKIE } from '@/shared/config/session';
import { GET, POST } from './route';

const withCookies = (request: NextRequest, cookies: Record<string, string>) => {
  Object.entries(cookies).forEach(([name, value]) => {
    request.cookies.set(name, value);
  });
  return request;
};

const postRequest = (body: unknown, cookies: Record<string, string>, query = '') =>
  withCookies(
    new NextRequest(`http://localhost/api/orders${query}`, {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    }),
    cookies,
  );

const getRequest = (cookies: Record<string, string>, query = '') =>
  withCookies(new NextRequest(`http://localhost/api/orders${query}`), cookies);

const session = (index = 0) => createSessionToken(accounts[index].id);

describe('POST /api/orders', () => {
  afterEach(() => {
    resetOrders();
  });

  it('creates an order for the signed-in user', async () => {
    const response = await POST(
      postRequest(
        { items: [{ productId: 'p1', quantity: 2 }] },
        {
          [SESSION_COOKIE]: session(),
        },
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.order).toMatchObject({
      id: 'o1',
      items: [{ productId: 'p1', quantity: 2 }],
    });
  });

  it('returns 401 without a session and in the expired scenario', async () => {
    const anonymous = await POST(postRequest({ items: [] }, {}));
    expect(anonymous.status).toBe(401);
    expect(await anonymous.json()).toEqual({ message: '로그인이 필요합니다.' });

    const expired = await POST(
      postRequest(
        { items: [{ productId: 'p1', quantity: 1 }] },
        {
          [SESSION_COOKIE]: session(),
          [SCENARIO_COOKIE]: 'expired',
        },
      ),
    );
    expect(expired.status).toBe(401);
  });

  it('rejects an empty item list, an unknown product and a non-positive quantity', async () => {
    const cookies = { [SESSION_COOKIE]: session() };

    expect((await POST(postRequest({ items: [] }, cookies))).status).toBe(400);
    expect(
      (await POST(postRequest({ items: [{ productId: 'p999', quantity: 1 }] }, cookies))).status,
    ).toBe(400);
    expect(
      (await POST(postRequest({ items: [{ productId: 'p1', quantity: 0 }] }, cookies))).status,
    ).toBe(400);
    expect(
      (await POST(postRequest({ items: [{ productId: 'p1', quantity: 1.5 }] }, cookies))).status,
    ).toBe(400);
    expect((await POST(postRequest('{not json', cookies))).status).toBe(400);
  });
});

describe('GET /api/orders', () => {
  afterEach(() => {
    resetOrders();
  });

  it("returns only the signed-in user's orders", async () => {
    await POST(
      postRequest(
        { items: [{ productId: 'p1', quantity: 1 }] },
        {
          [SESSION_COOKIE]: session(0),
        },
      ),
    );
    await POST(
      postRequest(
        { items: [{ productId: 'p2', quantity: 3 }] },
        {
          [SESSION_COOKIE]: session(1),
        },
      ),
    );

    const first = await (await GET(getRequest({ [SESSION_COOKIE]: session(0) }))).json();
    const second = await (await GET(getRequest({ [SESSION_COOKIE]: session(1) }))).json();

    expect(first.orders).toHaveLength(1);
    expect(first.orders[0].items).toEqual([{ productId: 'p1', quantity: 1 }]);
    expect(second.orders[0].items).toEqual([{ productId: 'p2', quantity: 3 }]);
  });

  it('returns an empty list for a user with no orders', async () => {
    const response = await GET(getRequest({ [SESSION_COOKIE]: session(7) }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ orders: [] });
  });

  it('returns 401 without a session', async () => {
    expect((await GET(getRequest({}))).status).toBe(401);
  });
});
