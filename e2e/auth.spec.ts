import { authenticatedTest, expect, test } from './fixtures/auth';
import { CommercePage } from './pages/CommercePage';
import { LoginPage } from './pages/LoginPage';
import { createExpiredSessionCookie } from './pages/sessionCookie';

const TEST_PASSWORD = 'looper1234';
const LOGIN_FAILED_MESSAGE = '이메일 또는 비밀번호를 확인해주세요.';

test('미로그인으로 주문서에 들어가면 로그인 후 원래 주문서로 돌아와 주문을 완료한다', async ({
  page,
  workerAccount,
}) => {
  const commercePage = new CommercePage(page);
  const loginPage = new LoginPage(page);

  await test.step('상품을 장바구니에 담는다', async () => {
    await commercePage.addFirstProductToCart();
  });

  await test.step('미로그인으로 주문서에 진입하면 로그인 화면으로 이동한다', async () => {
    await commercePage.openCart();
    await loginPage.expectRedirectTarget('/orders/new');
  });

  const productId = await test.step('로그인하면 원래 주문서와 담은 상품을 복원한다', async () => {
    await loginPage.submit(workerAccount.email, TEST_PASSWORD);
    return commercePage.expectOrderFormWithOneProduct();
  });

  await test.step('주문을 접수하고 주문 내역에서 확인한다', async () => {
    await commercePage.completeOrder(productId);
  });

  await test.step('주문 후 장바구니가 비워진다', async () => {
    await commercePage.expectCartCleared();
  });
});

test('잘못된 비밀번호 안내 후 입력을 고쳐 로그인하면 원래 경로로 이동한다', async ({
  page,
  workerAccount,
}) => {
  const loginPage = new LoginPage(page);

  await page.goto('/login?next=%2Forders%2Fnew');

  await test.step('잘못된 비밀번호를 제출하면 실패 안내와 입력값을 유지한다', async () => {
    await loginPage.submit(workerAccount.email, 'wrong-password');
    await loginPage.expectFailure(LOGIN_FAILED_MESSAGE);
    await expect(page.getByRole('textbox', { name: '이메일' })).toHaveValue(workerAccount.email);
  });

  await test.step('비밀번호를 고쳐 제출하면 원래 주문서로 이동한다', async () => {
    await loginPage.submit(workerAccount.email, TEST_PASSWORD);
    await expect(page).toHaveURL('/orders/new');
    await expect(page.getByRole('heading', { name: '주문서' })).toBeVisible();
  });
});

authenticatedTest(
  '만료 시나리오에서 안내 후 다시 로그인해 원래 주문 내역으로 돌아간다',
  async ({ page, context, baseURL, workerAuth }) => {
    if (baseURL === undefined) {
      throw new Error('Playwright baseURL이 필요합니다.');
    }

    const loginPage = new LoginPage(page);

    await authenticatedTest.step('만료 상태로 주문 내역에 진입한다', async () => {
      await context.addCookies([{ name: 'scenario', value: 'expired', url: baseURL }]);
      await page.goto('/orders?view=recent');
    });

    await authenticatedTest.step(
      '원래 경로가 담긴 로그인 화면에서 만료 안내를 확인한다',
      async () => {
        await loginPage.expectRedirectTarget('/orders?view=recent', true);
        await loginPage.expectExpiredNotice();
      },
    );

    await authenticatedTest.step('다시 로그인하면 원래 주문 내역으로 돌아간다', async () => {
      await context.clearCookies({ name: 'scenario' });
      await loginPage.submit(workerAuth.account.email, TEST_PASSWORD);
      await expect(page).toHaveURL('/orders?view=recent');
      await expect(page.getByRole('heading', { name: '주문 내역' })).toBeVisible();
    });
  },
);

/**
 * 실제 토큰 만료 판정.
 *
 * 위 테스트는 `scenario=expired` 쿠키를 쓰는데, 서버는 그 쿠키를 보는 순간 만료로 답하고
 * 토큰의 `exp` 비교를 지나지 않는다. 그래서 그 비교를 통째로 지워도 위 테스트는 통과한다.
 * 여기서는 서명이 유효하고 `exp`만 지난 토큰을 직접 넣어 그 판정을 지나게 한다.
 *
 * 조건 — 시나리오 쿠키 없음, 서명 유효, 브라우저 쿠키의 수명은 미래(브라우저가 버리지 않게).
 */
test('exp가 지난 토큰으로 보호 경로에 들어가면 만료 안내와 함께 로그인 화면으로 보낸다', async ({
  page,
  context,
  baseURL,
  workerAccount,
}) => {
  if (baseURL === undefined) {
    throw new Error('Playwright baseURL이 필요합니다.');
  }

  const loginPage = new LoginPage(page);
  const userId = `u${workerAccount.email.match(/\d+/)?.[0] ?? '1'}`;

  await test.step('exp만 지난 토큰을 쿠키에 넣는다', async () => {
    await context.addCookies([createExpiredSessionCookie(userId, baseURL)]);
  });

  await test.step('보호 경로에 들어가면 만료 안내가 있는 로그인 화면으로 간다', async () => {
    await page.goto('/orders?view=recent');
    await loginPage.expectRedirectTarget('/orders?view=recent', true);
    await loginPage.expectExpiredNotice();
  });

  await test.step('다시 로그인하면 원래 주문 내역으로 돌아간다', async () => {
    await loginPage.submit(workerAccount.email, TEST_PASSWORD);
    await expect(page).toHaveURL('/orders?view=recent');
    await expect(page.getByRole('heading', { name: '주문 내역' })).toBeVisible();
  });
});
