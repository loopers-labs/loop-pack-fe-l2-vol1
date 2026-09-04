import { expect, test } from '@playwright/test'
import { flowIdOf, readStoredFlowId, waitForAnalyticsEvent } from './fixtures/analytics'
import { accountMenu, submitLogin } from './fixtures/login-actions'
import { accountForSlot, TEST_PASSWORD } from './fixtures/test-accounts'

// 이 파일만 storageState를 쓰지 않는다. 로그인 화면 진입·성공·실패가 검증 대상이라
// 로그인된 상태를 주입해 버리면 검증할 것이 남지 않는다.
// 범위와 단언은 docs/rfc/week09-e2e-scope.md의 「4단계 경계」에서 정했다.
test.describe('인증 플로우', () => {
  test('미로그인으로 보호 경로에 들어가면 로그인 후 원래 경로로 돌아온다', async ({
    page,
    browser,
  }, testInfo) => {
    const account = accountForSlot(testInfo.parallelIndex)

    await page.goto('/orders')

    // 가드가 만든 로그인 URL에는 entryPoint가 없고 돌아갈 경로만 실린다.
    expect(new URL(page.url()).pathname).toBe('/login')
    expect(new URL(page.url()).searchParams.get('returnUrl')).toBe('/orders')

    // 로그인 성공은 전체 이동을 일으켜 이벤트 버퍼가 사라진다. 시작 이벤트는 이동 전에 읽는다.
    const loginStart = await waitForAnalyticsEvent(page, 'login_start')
    const flowId = flowIdOf(loginStart)
    expect(loginStart.properties.entry_point).toBe('protected_route')
    expect(loginStart.properties.return_path).toBe('/orders')

    await submitLogin(page, account)

    await page.waitForURL('**/orders')
    await expect(accountMenu(page, account)).toBeVisible()
    // login_success가 읽는 값이 그대로 유지된다 — 두 이벤트가 같은 흐름으로 묶인다.
    expect(await readStoredFlowId(page)).toBe(flowId)

    // 초기 HTML에도 로그인 상태가 있어야 한다. JS를 끈 컨텍스트에서는 서버가 그린 것만 남는다.
    const scriptlessContext = await browser.newContext({
      javaScriptEnabled: false,
      storageState: await page.context().storageState(),
    })

    try {
      const scriptlessPage = await scriptlessContext.newPage()
      await scriptlessPage.goto('/orders')

      await expect(accountMenu(scriptlessPage, account)).toBeVisible()
    } finally {
      await scriptlessContext.close()
    }
  })

  test('세션이 만료되면 주문 내역에서 로그인 화면으로 보낸다', async ({
    page,
    context,
  }, testInfo) => {
    const account = accountForSlot(testInfo.parallelIndex)

    await page.goto('/login')
    await submitLogin(page, account)
    await expect(accountMenu(page, account)).toBeVisible()

    // 만료된 쿠키를 만들지 않는다. 가드는 쿠키의 존재만 보고 서명·만료 검증은 API에 있으므로,
    // 유효한 세션에 scenario 쿠키를 더해 API만 401을 내게 한다.
    await context.addCookies([
      { name: 'scenario', value: 'expired', url: new URL(page.url()).origin },
    ])

    // 세션 조회의 401은 null로 흡수되므로 화면이 스스로 알아채지 못한다.
    // 401을 던지는 쿼리가 있는 화면은 지금 주문 내역 하나뿐이다.
    await page.goto('/orders')

    await page.waitForURL('**/login?**')
    expect(new URL(page.url()).searchParams.get('returnUrl')).toBe('/orders')
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible()
  })

  test('잘못된 비밀번호는 오류를 보여주고 재시도하면 로그인된다', async ({ page }, testInfo) => {
    const account = accountForSlot(testInfo.parallelIndex)

    await page.goto('/login')
    await submitLogin(page, account, 'wrong-password')

    // Next의 라우트 안내 영역도 role="alert"라 폼 안으로 좁힌다.
    await expect(page.locator('form').getByRole('alert')).toHaveText(
      '이메일 또는 비밀번호를 확인해주세요.',
    )
    // 로그인 401은 전역 만료 처리로 새지 않는다. 화면을 벗어나면 그 규칙이 깨진 것이다.
    expect(new URL(page.url()).pathname).toBe('/login')

    // 실패는 이동을 일으키지 않아 시작과 실패가 같은 문서에 남는다. 같은 흐름인지 여기서 본다.
    const loginStart = await waitForAnalyticsEvent(page, 'login_start')
    const loginFail = await waitForAnalyticsEvent(page, 'login_fail')
    expect(flowIdOf(loginFail)).toBe(flowIdOf(loginStart))

    await submitLogin(page, account, TEST_PASSWORD)

    await page.waitForURL('**/')
    await expect(accountMenu(page, account)).toBeVisible()
  })
})
