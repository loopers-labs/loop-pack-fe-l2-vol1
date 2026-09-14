import type { BrowserContext } from '@playwright/test';
import { createSessionToken } from '../../src/app/api/_data/auth';
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
} from '../../src/app/api/_data/auth-cookies';

const EXPIRED_MARGIN_SECONDS = 1;

export async function setExpiredSessionCookie(
  context: BrowserContext,
  baseURL: string | undefined,
): Promise<void> {
  if (!baseURL) {
    throw new Error('Playwright baseURL이 필요합니다.');
  }

  const issuedAt =
    Date.now() -
    (SESSION_TTL_SECONDS + EXPIRED_MARGIN_SECONDS) * 1_000;

  await context.addCookies([
    {
      name: SESSION_COOKIE,
      value: createSessionToken('u1', issuedAt),
      url: baseURL,
      httpOnly: true,
      sameSite: 'Lax',
      secure: new URL(baseURL).protocol === 'https:',
    },
  ]);
}
