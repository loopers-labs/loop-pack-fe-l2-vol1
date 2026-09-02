import {
  getRedirectUrl,
  unstable_doesMiddlewareMatch as unstableDoesProxyMatch,
} from 'next/experimental/testing/server';
import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

import { config, proxy } from './proxy';

import { accounts, createSessionToken } from '@/app/api/_data/auth';
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
} from '@/app/api/_data/auth-cookies';

const requestTo = (path: string, session?: string) => {
  const request = new NextRequest(`http://localhost${path}`);

  if (session) request.cookies.set(SESSION_COOKIE, session);

  return request;
};

const redirectTarget = (response: ReturnType<typeof proxy>) =>
  new URL(getRedirectUrl(response) ?? '');

const matchesProxy = (url: string) => unstableDoesProxyMatch({ config, url });

describe('config.matcher', () => {
  it.each(['/orders', '/orders/new', '/orders/1/items'])(
    '%s에서 proxy가 실행된다',
    (pathname) => {
      expect(matchesProxy(pathname)).toBe(true);
    },
  );

  it.each(['/', '/cart', '/my', '/login', '/products'])(
    '%s에서 proxy가 실행되지 않는다',
    (pathname) => {
      expect(matchesProxy(pathname)).toBe(false);
    },
  );
});

describe('proxy', () => {
  it.each(['/orders', '/orders/new', '/orders?status=pending'])(
    '쿠키 없이 %s에 오면 307로 로그인 경로에 원래 경로를 실어 보낸다',
    (path) => {
      const response = proxy(requestTo(path));
      const target = redirectTarget(response);

      expect(response.status).toBe(307);
      expect(target.pathname).toBe('/login');
      expect(target.searchParams.get('next')).toBe(path);
      expect(target.searchParams.get('from')).toBe('orders');
    },
  );

  it('서명이 맞지 않는 쿠키는 통과시키지 않는다', () => {
    const [payload] = createSessionToken(accounts[0].id).split('.');

    expect(proxy(requestTo('/orders', `${payload}.forged`)).status).toBe(307);
  });

  it('만료된 쿠키는 통과시키지 않는다', () => {
    const now = Date.parse('2026-08-29T00:00:00Z');
    const issuedAt = now - (SESSION_TTL_SECONDS + 1) * 1000;
    const expired = createSessionToken(accounts[0].id, issuedAt);

    vi.spyOn(Date, 'now').mockReturnValue(now);

    expect(proxy(requestTo('/orders', expired)).status).toBe(307);
  });

  it('유효한 쿠키는 요청을 그대로 통과시킨다', () => {
    const response = proxy(
      requestTo('/orders', createSessionToken(accounts[0].id)),
    );

    expect(response.status).toBe(200);
    expect(getRedirectUrl(response)).toBeNull();
  });
});
