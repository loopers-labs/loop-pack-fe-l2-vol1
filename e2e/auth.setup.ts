import path from 'path';
import { expect, test as setup } from '@playwright/test';

// [AI] week-09 4-1: 로그인 1회 저장 setup. 매 테스트에서 폼을 채우지 않는다.
// 계정 8개를 워커 인덱스와 1:1로 대응시켜 워커별 저장 파일 8개를 만든다.
// 인증 자체를 검증하는 스펙(e2e/auth/)은 storageState를 쓰지 않는 별도 프로젝트로 강제한다
// (저장된 상태로 시작하면 로그인 과정을 안 거치므로 검증 불가 — playwright.config.ts 참고).

const AUTH_DIR = path.join(__dirname, '.auth');

const ACCOUNTS = Array.from({ length: 8 }, (_, i) => ({
  email: `looper${i + 1}@loopers.dev`,
  password: 'looper1234',
}));

for (const [index, account] of ACCOUNTS.entries()) {
  setup(`로그인 상태 저장 — ${account.email} → worker-${index}.json`, async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('이메일').fill(account.email);
    await page.getByLabel('비밀번호').fill(account.password);
    await page.getByRole('button', { name: '로그인' }).click();

    // [AI] 성공 판정: 홈으로 이동 후 헤더에 로그아웃 버튼이 떠야 세션 쿠키가 발급된 것.
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible();

    await page.context().storageState({ path: path.join(AUTH_DIR, `worker-${index}.json`) });
  });
}
