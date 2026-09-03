import { SCENARIO_COOKIE } from '@/app/api/_data/auth-cookies';
import { AUTH_REASON_PARAM, LOGIN_PATH, RETURN_TO_PARAM } from '@/shared/config/routes';
import { expect, test } from '@playwright/test';

/**
 * RFC C-1 인증 5갈래 (docs/rfc/week09-e2e-scope.md).
 *
 * `worker-auth` fixture(storageState) 를 쓰지 않는다. 이 파일이 검증하는 것 자체가
 * "미로그인 → 로그인" 또는 "로그인 → 만료" 로 넘어가는 전이이고, 이미 로그인된 상태로
 * 시작하면 그 전이가 사라져 검증 대상이 없어진다.
 *
 * 대기는 전부 조건 기반이다. `sleep` 을 쓰지 않는다.
 */
const EMAIL = 'looper1@loopers.dev';
const PASSWORD = 'looper1234';

const header = (page: import('@playwright/test').Page) => page.getByRole('banner');

const login = async (page: import('@playwright/test').Page) => {
  await page.getByLabel('이메일').fill(EMAIL);
  await page.getByLabel('비밀번호').fill(PASSWORD);
  await page.getByRole('button', { name: '로그인' }).click();
};

test.describe('항목 1 — 미로그인 → 보호 경로 → 로그인 → 원래 경로 복원', () => {
  test('헤더의 장바구니를 눌러 주문서로 가면 로그인 후 주문서로 되돌아온다', async ({ page }) => {
    await page.goto('/');

    // RFC C-4: 이 시나리오는 헤더에서 주문서로 들어간다.
    await header(page).getByRole('link', { name: '장바구니 0' }).click();

    await page.waitForURL((url) => url.pathname === LOGIN_PATH);
    expect(new URL(page.url()).searchParams.get(RETURN_TO_PARAM)).toBe('/order');
    expect(new URL(page.url()).searchParams.get(AUTH_REASON_PARAM)).toBe('required');
    await expect(page.getByRole('status')).toHaveText('로그인이 필요한 페이지입니다.');

    await login(page);

    await page.waitForURL((url) => url.pathname === '/order');
    await expect(page.getByRole('heading', { name: '주문하기' })).toBeVisible();
  });
});

test.describe('항목 2 — 세션 만료', () => {
  test('로그인한 뒤 세션이 만료되면 보호 화면에서 만료 안내와 함께 로그인 화면으로 이동한다', async ({
    page,
    context,
  }) => {
    await page.goto('/login');
    await login(page);
    await expect(header(page).getByRole('link', { name: '마이페이지' })).toBeVisible();

    // proxy 는 세션 쿠키의 존재만 보므로 그대로 통과하고, /mypage 가 클라이언트에서 부르는
    // /api/auth/me 가 이 노브로 401 을 돌려줘 401 인터셉터가 만료로 처리한다.
    await context.addCookies([{ name: SCENARIO_COOKIE, value: 'expired', url: page.url() }]);
    await page.goto('/mypage');

    await page.waitForURL((url) => url.pathname === LOGIN_PATH);
    expect(new URL(page.url()).searchParams.get(AUTH_REASON_PARAM)).toBe('expired');
    await expect(page.getByRole('status')).toHaveText('세션이 만료되었습니다. 다시 로그인해주세요.');
  });
});

test.describe('항목 3 — 잘못된 자격 증명', () => {
  test('로그인이 거부되면 실패 문구가 뜨고 URL 은 로그인 화면에 그대로 남는다', async ({ page, context }) => {
    await page.goto('/login');
    await context.addCookies([{ name: SCENARIO_COOKIE, value: 'invalid', url: page.url() }]);

    await login(page);

    // main 안으로 좁힌다. Next 가 body 직속에 심는 라우트 안내자(#__next-route-announcer__)도
    // role="alert" 라, 화면 전체에서 찾으면 빈 announcer 와 둘이 잡혀 strict mode 위반이 난다.
    await expect(page.getByRole('main').getByRole('alert')).toHaveText('이메일 또는 비밀번호를 확인해주세요.');
    expect(new URL(page.url()).pathname).toBe(LOGIN_PATH);
  });
});

test.describe('항목 4 — 오픈 리다이렉트', () => {
  test('returnTo 가 외부 주소를 가리켜도 로그인 후 우리 origin 을 벗어나지 않는다', async ({ page, baseURL }) => {
    await page.goto(`${LOGIN_PATH}?${RETURN_TO_PARAM}=//evil.com`);

    await login(page);

    // 브라우저가 실제로 어디에 있는지를 본다 — "코드가 계산한 목적지"가 아니라
    // "이동이 실제로 어디로 갔는가"가 이 갈래의 존재 이유다.
    await expect(page).toHaveURL(`${baseURL}/`);
    await expect(header(page).getByRole('link', { name: '마이페이지' })).toBeVisible();
  });
});

test.describe('항목 5 — 헤더가 로그인 상태를 따라간다', () => {
  test('로그인하면 헤더가 마이페이지·로그아웃으로 바뀌고 로그아웃하면 다시 로그인 링크로 돌아온다', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(header(page).getByRole('link', { name: '로그인' })).toBeVisible();

    await header(page).getByRole('link', { name: '로그인' }).click();
    await login(page);

    await expect(header(page).getByRole('link', { name: '마이페이지' })).toBeVisible();
    await expect(header(page).getByRole('button', { name: '로그아웃' })).toBeVisible();

    await header(page).getByRole('button', { name: '로그아웃' }).click();

    await expect(header(page).getByRole('link', { name: '로그인' })).toBeVisible();
  });
});
