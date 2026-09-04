import { expect, test } from './fixtures';
import { expectLoggedInAs, openCheckoutFromHeader } from './pom/header';
import { gotoLogin, login } from './pom/login';

// E1 · E3 (RFC C절). 로그인 자체를 검증하므로 storageState를 쓰지 않는다 —
// 이미 로그인된 상태로 시작하면 로그인 흐름이 깨져도 통과한다.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('인증 플로우', () => {
  test('E1 미로그인으로 주문서에 들어가면 로그인 후 그 화면으로 돌아온다', async ({
    page,
    account,
  }) => {
    await page.goto('/products');
    await expect(page).toHaveURL('/products');

    // 헤더 링크로 진입 — proxy가 302로 로그인으로 보내고 next에 원래 경로를 싣는다.
    await openCheckoutFromHeader(page);
    await expect(page).toHaveURL('/login?next=%2Fcheckout');

    await login(page, account);

    // 복원: URL부터 단언한다 — 요소보다 먼저 보면 "가드가 안 돌았다"와 "화면이 안 그려졌다"가 갈린다.
    await expect(page).toHaveURL('/checkout');
    await expect(page.getByRole('heading', { name: '주문서' })).toBeVisible();
    await expectLoggedInAs(page, account.name);

    // 쿠키 속성 — 굽는 건 서버, 해석하는 건 브라우저. jsdom에서는 어떤 값을 넣어도 같다.
    const session = (await page.context().cookies()).find(
      (cookie) => cookie.name === 'session',
    );
    expect(session?.httpOnly).toBe(true);
    expect(session?.sameSite).toBe('Lax');
  });

  test('E1-SSR 로그인 뒤 새로 받은 HTML에 로그인 상태가 이미 들어 있다', async ({
    page,
    account,
  }) => {
    await gotoLogin(page);
    await login(page, account);
    await expectLoggedInAs(page, account.name);

    // JavaScript 실행 전 초기 HTML을 본다 — 서버가 쿠키를 읽어 헤더를 채웠는지.
    const response = await page.request.get('/products');
    const html = await response.text();
    expect(html).toContain(`${account.name}<!-- -->님`);
    expect(html).toContain('로그아웃');
  });

  test('E3 틀린 비밀번호는 문구를 보여주고 세션을 만들지 않는다', async ({
    page,
    account,
  }) => {
    await gotoLogin(page);
    await login(page, { email: account.email, password: 'wrong-password' });

    await expect(page).toHaveURL('/login');
    // page 전체의 role=alert에는 Next 라우트 안내자(#__next-route-announcer__)도 잡힌다 — main 안으로 좁힌다.
    await expect(page.getByRole('main').getByRole('alert')).toHaveText(
      '이메일 또는 비밀번호를 확인해주세요.',
    );
    const cookies = await page.context().cookies();
    expect(cookies.some((cookie) => cookie.name === 'session')).toBe(false);
  });
});
