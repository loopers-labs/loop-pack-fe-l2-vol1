import { test as setup } from '@playwright/test';
import { accounts } from './support/accounts';

// 계정 8개 전부 미리 로그인해서 워커별 storageState 파일(.auth/worker-N.json)을
// 만들어둔다. 실제 실행 워커 수가 몇이든(fixtures.ts가 workerIndex % 8로
// 파일을 고름) 필요한 파일 8개가 이미 준비돼 있는 구조다.
//
// 로그인 자체를 검증하는 테스트(미로그인 복원, 잘못된 자격증명)는 이 파일과
// 무관하게 매번 빈 상태로 시작한다 — storageState가 있으면 이미 로그인된
// 상태로 시작해 로그인 흐름 자체가 깨져도 테스트가 통과해버리기 때문이다.
for (const [index, account] of accounts.entries()) {
  setup(`로그인 상태를 저장한다 (계정 ${index})`, async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('이메일').fill(account.email);
    await page.getByLabel('비밀번호').fill(account.password);
    await page.getByRole('button', { name: '로그인' }).click();
    await page.getByRole('button', { name: '로그아웃' }).waitFor();

    await page.context().storageState({ path: `.auth/worker-${index}.json` });
  });
}
