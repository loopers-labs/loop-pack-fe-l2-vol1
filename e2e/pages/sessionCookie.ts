import { createHmac } from 'node:crypto';

/**
 * 앱과 같은 형식·같은 비밀로 세션 쿠키를 만든다.
 *
 * 화면을 지나지 않고 로그인 상태를 만들어야 하는 테스트가 쓴다. JS를 끈 테스트는 폼 제출이
 * 동작하지 않아 화면으로 로그인할 수 없고, 만료 판정 테스트는 시간을 흘려보낼 수 없다.
 *
 * 형식은 `base64url(payload).base64url(hmac)`이다. 서명이 유효해야 서버가 payload의 `exp`까지
 * 읽는다. 서명이 틀리면 그 앞에서 걸러져 만료 판정을 지나지 않는다.
 */
const DEFAULT_SECRET = 'loopers-week09-secret';
const ONE_HOUR_SECONDS = 60 * 60;
/** exp가 막 지난 토큰. 시계 오차로 살아나지 않을 만큼만 뒤로 둔다 */
const JUST_EXPIRED_SECONDS = -60;

type SessionCookie = {
  name: string;
  value: string;
  url: string;
  expires: number;
};

function sign(payload: string): string {
  const secret = process.env.AUTH_SESSION_SECRET ?? DEFAULT_SECRET;
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

/** `expiresInSeconds`가 음수면 서명은 유효하고 `exp`만 지난 토큰이 된다 */
export function createSessionToken(userId: string, expiresInSeconds: number): string {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({ userId, iat: nowSeconds, exp: nowSeconds + expiresInSeconds }),
  ).toString('base64url');

  return `${payload}.${sign(payload)}`;
}

/**
 * 브라우저 쿠키 자체의 수명은 항상 미래로 둔다.
 *
 * 만료 판정을 확인하려면 쿠키가 서버까지 실려 가야 한다. 쿠키를 함께 만료시키면 브라우저가
 * 버려서 서버는 "로그인한 적 없는 사람"으로 보고, 확인하려던 분기를 지나지 않는다.
 */
function toCookie(userId: string, url: string, expiresInSeconds: number): SessionCookie {
  return {
    name: 'session',
    value: createSessionToken(userId, expiresInSeconds),
    url,
    expires: Math.floor(Date.now() / 1000) + ONE_HOUR_SECONDS,
  };
}

export function createSessionCookie(userId: string, url: string): SessionCookie {
  return toCookie(userId, url, ONE_HOUR_SECONDS);
}

export function createExpiredSessionCookie(userId: string, url: string): SessionCookie {
  return toCookie(userId, url, JUST_EXPIRED_SECONDS);
}
