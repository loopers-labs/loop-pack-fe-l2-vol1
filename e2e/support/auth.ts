import type { Page } from '@playwright/test'

import {
  accounts,
  createSessionToken,
  TEST_PASSWORD,
} from '@/app/api/_data/auth'
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
} from '@/app/api/_data/auth-cookies'

// 주문은 서버 프로세스 메모리에 userId로 쌓인다. worker가 계정을 공유하면
// worker 수에 따라 주문 내역이 달라지므로 worker마다 다른 계정을 쓴다.
export function workerAccount(workerIndex: number) {
  if (workerIndex >= accounts.length) {
    throw new Error(
      `E2E 계정이 부족하다. worker ${String(workerIndex)}에 배정할 계정이 없다. 사용 가능한 계정은 ${String(accounts.length)}개다.`,
    )
  }
  return accounts[workerIndex]
}

// 서명은 유효하지만 exp가 지난 토큰이다. proxy는 쿠키 존재만 확인해 보호 경로까지
// 통과시키고, 서버 컴포넌트가 만료로 판정해 reason=expired로 돌려보낸다.
export function expiredSessionCookie(userId: string) {
  const issuedAtMs = Date.now() - (SESSION_TTL_SECONDS + 60) * 1_000
  return {
    name: SESSION_COOKIE,
    value: createSessionToken(userId, issuedAtMs),
    domain: 'localhost',
    path: '/',
  }
}

export async function signIn(
  page: Page,
  email: string,
  password: string = TEST_PASSWORD,
) {
  await page.getByRole('textbox', { name: '이메일' }).fill(email)
  await page.getByRole('textbox', { name: '비밀번호' }).fill(password)
  await page.getByRole('button', { name: '로그인' }).click()
}

export async function trackedEventNames(page: Page) {
  return page.evaluate(
    () => window.__analytics?.map((entry) => entry.event) ?? [],
  )
}

export async function trackedEvent(page: Page, event: string) {
  return page.evaluate(
    (name) =>
      window.__analytics?.find((entry) => entry.event === name)?.properties ??
      null,
    event,
  )
}
