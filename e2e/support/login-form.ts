import type { Page } from '@playwright/test';

// 로그인 폼 셀렉터를 한 곳에 모은다. 전엔 파일 3개 4곳(auth.setup.ts,
// auth-invalid-credentials.spec.ts, auth-redirect-restore.spec.ts 2곳)에
// getByLabel('이메일')/getByLabel('비밀번호')가 그대로 흩어져 있어서,
// RFC의 "라벨이 바뀌면 셀렉터 1곳만 고치면 된다"는 유지보수 비용 추정이
// 실제와 안 맞았다(9주차 피드백). 이제 진짜로 여기 한 곳만 고치면 된다.
export async function fillLoginForm(
  page: Page,
  { email, password }: { email: string; password: string },
) {
  await page.getByLabel('이메일').fill(email);
  await page.getByLabel('비밀번호').fill(password);
}
