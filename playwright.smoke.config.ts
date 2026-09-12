import { defineConfig, devices } from '@playwright/test';

// 06-smoke-test-plan.md 7번 — 배포된 URL을 대상으로 하므로 webServer가 없다.
// 로컬 서버를 띄우는 playwright.config.ts와 이 점이 유일하게 다른 목적이라 config를 분리했다.
const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL;

if (!DEPLOYMENT_URL) {
  throw new Error('DEPLOYMENT_URL이 설정되지 않았다. 예: DEPLOYMENT_URL=https://... pnpm test:smoke');
}

const BYPASS_SECRET = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

// Preview 배포 URL(이 계정 scope)일 때만 bypass를 보낸다 — extraHTTPHeaders는 모든 요청에 붙어, 다른 호스트로 secret이 나가면 안 된다.
// set-bypass-cookie로 받은 URL 전용 쿠키를 서버 self-fetch가 넘겨 받는다(apiFetch의 Preview 분기).
// ponytail: secret이 없으면 헤더 없이 진행 — Production 도메인은 보호 대상이 아니다.
const isProtectedPreview = new URL(DEPLOYMENT_URL).hostname.endsWith('-hyeodoong2s-projects.vercel.app');

export default defineConfig({
  testDir: './smoke',
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  retries: 0,
  use: {
    baseURL: DEPLOYMENT_URL,
    // trace는 요청 헤더를 기록한다 — 이 산출물을 artifact로 올리면 bypass secret이 함께 올라간다
    trace: 'retain-on-failure',
    extraHTTPHeaders: BYPASS_SECRET && isProtectedPreview ? { 'x-vercel-protection-bypass': BYPASS_SECRET, 'x-vercel-set-bypass-cookie': 'true' } : undefined
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
