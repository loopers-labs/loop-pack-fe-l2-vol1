// [AI] week-09 4-2: 인증 필수 3갈래 (RFC C-5). storageState를 쓰지 않는다 —
// 이 스펙은 "로그인 자체"를 검증하는데, 저장된 로그인 상태로 시작하면
// 로그인 과정을 거치지 않아 검증 자체가 불가능하기 때문.
// 구조적 강제: 이 파일은 playwright.config.ts의 'auth' 프로젝트(storageState 없음)만 실행한다.
// 모든 로그인은 진짜 사용자처럼 폼을 채워서 수행한다 (API 직접 호출 위조 금지).
import { expect, test } from '@playwright/test';

test.describe('인증 필수 3갈래', () => {
  test('① 미로그인으로 보호 경로 진입 → 로그인 → 원래 경로 복원', async ({ page }) => {
    // 미로그인으로 보호 경로 진입 → proxy 가드가 원래 경로를 redirectTo에 실어 /login으로 보낸다
    await page.goto('/orders');
    await expect(page).toHaveURL(/\/login\?redirectTo=%2Forders$/);

    // 진짜 사용자처럼 폼으로 로그인
    await page.getByLabel('이메일').fill('looper1@loopers.dev');
    await page.getByLabel('비밀번호').fill('looper1234');
    await page.getByRole('button', { name: '로그인' }).click();

    // 원래 경로 복원 + 서버 판독 로그인 상태(초기 HTML) 확인
    await expect(page).toHaveURL(/\/orders$/);
    await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible();
  });

  test('② 세션 만료 → 만료 안내와 함께 로그인으로 이동, 복원 경로 유지', async ({
    page,
    context,
  }) => {
    // 만료를 재현하려면 유효한 세션이 먼저 필요하므로 폼으로 로그인한다
    await page.goto('/login');
    await page.getByLabel('이메일').fill('looper2@loopers.dev');
    await page.getByLabel('비밀번호').fill('looper1234');
    await page.getByRole('button', { name: '로그인' }).click();
    await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible();

    // expired 시나리오 노브 (query 우선 → 없으면 cookie): 서버가 유효 쿠키를 만료로 판정하게 만든다
    await context.addCookies([
      { name: 'scenario', value: 'expired', domain: 'localhost', path: '/' },
    ]);

    // 보호 경로 진입 → 보호 API 401 → 전역 처리기가 강제 로그아웃 후 만료 안내를 실어 /login 이동
    await page.goto('/orders');
    await expect(page).toHaveURL(/\/login\?redirectTo=%2Forders&expired=1$/, { timeout: 10_000 });
    await expect(page.getByRole('status')).toContainText(
      '세션이 만료되었어요. 다시 로그인해 주세요.'
    );
  });

  test('③ 잘못된 자격 증명 → 401 안내 표시, 로그인 화면에 머문다', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('이메일').fill('looper3@loopers.dev');
    await page.getByLabel('비밀번호').fill('wrong-password');
    await page.getByRole('button', { name: '로그인' }).click();

    // 400(형식)과 다른 401 전용 안내 문구 (RFC 401 두 얼굴 구분).
    // getByRole('alert')는 Next.js route announcer까지 잡는 strict 충돌이 있어 텍스트로 좁힌다.
    await expect(
      page.getByRole('alert').filter({ hasText: '이메일 또는 비밀번호가 일치하지 않아요' })
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});
