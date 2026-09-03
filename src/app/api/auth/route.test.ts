import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { accounts, TEST_PASSWORD } from '@/app/api/_data/auth';
import { SCENARIO_COOKIE, SESSION_COOKIE } from '@/shared/config/session';
import { POST as login } from './login/route';
import { POST as logout } from './logout/route';
import { GET as me } from './me/route';

const loginRequest = (body: unknown, query = '') =>
  new NextRequest(`http://localhost/api/auth/login${query}`, {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });

const sessionCookieFrom = (response: Response) =>
  response.headers.getSetCookie().find((cookie) => cookie.startsWith(`${SESSION_COOKIE}=`)) ?? '';

const signIn = async (email = accounts[0].email) => {
  const response = await login(loginRequest({ email, password: TEST_PASSWORD }));
  const cookie = sessionCookieFrom(response);
  return cookie.split(`${SESSION_COOKIE}=`)[1]?.split(';')[0] ?? '';
};

const meRequest = (cookies: Record<string, string>, query = '') => {
  const request = new NextRequest(`http://localhost/api/auth/me${query}`);
  Object.entries(cookies).forEach(([name, value]) => {
    request.cookies.set(name, value);
  });
  return request;
};

describe('POST /api/auth/login', () => {
  it('returns the user and sets an httpOnly session cookie', async () => {
    const response = await login(
      loginRequest({ email: accounts[0].email, password: TEST_PASSWORD }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ user: accounts[0] });

    const cookie = sessionCookieFrom(response);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=lax');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('Max-Age=3600');
  });

  it('rejects a wrong password and an unknown email with 401', async () => {
    const wrongPassword = await login(loginRequest({ email: accounts[0].email, password: 'nope' }));
    expect(wrongPassword.status).toBe(401);
    expect(await wrongPassword.json()).toEqual({
      message: '이메일 또는 비밀번호를 확인해주세요.',
    });

    const unknownEmail = await login(
      loginRequest({ email: 'nobody@loopers.dev', password: TEST_PASSWORD }),
    );
    expect(unknownEmail.status).toBe(401);
  });

  it('rejects a malformed body with 400', async () => {
    expect((await login(loginRequest('{not json'))).status).toBe(400);
    expect((await login(loginRequest({ email: accounts[0].email }))).status).toBe(400);
    expect((await login(loginRequest({ email: 1, password: 2 }))).status).toBe(400);
  });

  it('rejects an unknown scenario before applying it', async () => {
    const response = await login(
      loginRequest({ email: accounts[0].email, password: TEST_PASSWORD }, '?scenario=empty'),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: '요청 조건을 확인해주세요.' });
  });

  it('fails with 401 in the invalid scenario even with correct credentials', async () => {
    const response = await login(
      loginRequest({ email: accounts[0].email, password: TEST_PASSWORD }, '?scenario=invalid'),
    );

    expect(response.status).toBe(401);
    expect(sessionCookieFrom(response)).toBe('');
  });

  it('fails with 500 in the error scenario', async () => {
    const response = await login(
      loginRequest({ email: accounts[0].email, password: TEST_PASSWORD }, '?scenario=error'),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ message: '로그인에 실패했습니다.' });
  });
});

describe('GET /api/auth/me', () => {
  it('returns the signed-in user', async () => {
    const session = await signIn();
    const response = await me(meRequest({ [SESSION_COOKIE]: session }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ user: accounts[0] });
  });

  it('returns 401 without a cookie and with a tampered cookie', async () => {
    const missing = await me(meRequest({}));
    expect(missing.status).toBe(401);
    expect(await missing.json()).toEqual({ message: '로그인이 필요합니다.' });

    const session = await signIn();
    const tampered = await me(meRequest({ [SESSION_COOKIE]: `${session}x` }));
    expect(tampered.status).toBe(401);
  });

  it('returns 401 in the expired scenario from the query and from the cookie', async () => {
    const session = await signIn();

    const fromQuery = await me(meRequest({ [SESSION_COOKIE]: session }, '?scenario=expired'));
    expect(fromQuery.status).toBe(401);

    const fromCookie = await me(
      meRequest({ [SESSION_COOKIE]: session, [SCENARIO_COOKIE]: 'expired' }),
    );
    expect(fromCookie.status).toBe(401);
  });

  it('prefers the query scenario over the cookie scenario', async () => {
    const session = await signIn();
    const response = await me(
      meRequest({ [SESSION_COOKIE]: session, [SCENARIO_COOKIE]: 'expired' }, '?scenario=slow'),
    );

    expect(response.status).toBe(200);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the session cookie and answers 204', async () => {
    const response = await logout(
      new NextRequest('http://localhost/api/auth/logout', { method: 'POST' }),
    );

    expect(response.status).toBe(204);
    expect(sessionCookieFrom(response)).toContain('Max-Age=0');
  });
});
