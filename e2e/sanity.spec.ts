import { test, expect } from '@playwright/test';

// 10주차 2단계 자가 검증: e2e/ 변경 시 CI에서 E2E가 실제로 실행되는지
// 확인하기 위한 커밋(week10-ci.md F절 "걸리는 PR" 증거).
// 0단계 sanity check: Playwright가 production build 위에서
// 정상적으로 페이지를 로드할 수 있는지만 확인합니다.
// 실제 15개 항목별 E2E는 1단계 설계 완료 후 2단계에서 작성합니다.
test('홈 페이지가 production build 위에서 정상적으로 로드된다', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/.+/);
});
