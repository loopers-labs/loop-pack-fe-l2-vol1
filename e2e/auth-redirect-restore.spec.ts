import { test, expect } from './support/fixtures';

test.describe('미로그인 → 로그인 → 원래 경로 복원', () => {
  // 로그인 자체를 검증하는 테스트라 storageState를 쓰지 않는다 — 이미
  // 로그인된 상태로 시작하면 이 흐름(가드 → 리다이렉트 → 로그인 → 복원)
  // 자체가 깨져도 테스트가 통과해버린다.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('보호 경로 접근 → 로그인 → 원래 경로로 복원된다', async ({
    page,
    context,
    account,
  }) => {
    await page.goto('/orders/new');

    // proxy.ts가 session 쿠키가 없는 요청을 여기서 걸러낸다.
    await expect(page).toHaveURL(/\/login\?redirect=%2Forders%2Fnew/);

    await page.getByLabel('이메일').fill(account.email);
    await page.getByLabel('비밀번호').fill(account.password);
    await page.getByRole('button', { name: '로그인' }).click();

    await expect(page).toHaveURL('/orders/new');
    await expect(
      page.getByRole('heading', { name: '주문서', level: 1 }),
    ).toBeVisible();

    // 과제가 "통합 테스트로 못 잡는 것"의 예시로 든 것 중 하나(쿠키 속성).
    // MSW로 Set-Cookie 헤더 문자열을 흉내내도 httpOnly를 해석하는 주체가
    // jsdom엔 없어서, 진짜 브라우저·진짜 응답이 있어야만 확인된다.
    const cookies = await context.cookies();
    const sessionCookie = cookies.find((cookie) => cookie.name === 'session');
    expect(sessionCookie?.httpOnly).toBe(true);
  });

  // 5단계 자가 검증에서 getSafeRedirectPath의 검증을 없애봤더니 기존
  // 케이스로는 못 잡는 걸 확인해 추가한 경계 케이스. redirect 파라미터로
  // 외부 주소를 넣어도 그쪽으로 나가면 안 된다(오픈 리다이렉트 방지).
  test('redirect 파라미터로 외부 주소를 넣어도 그쪽으로 나가지 못한다', async ({
    page,
    account,
  }) => {
    await page.route('https://evil.com/**', (route) => route.abort());

    await page.goto('/login?redirect=https%3A%2F%2Fevil.com');
    await page.getByLabel('이메일').fill(account.email);
    await page.getByLabel('비밀번호').fill(account.password);
    await page.getByRole('button', { name: '로그인' }).click();

    await expect(page).toHaveURL('/');
  });
});
