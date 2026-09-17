import { defineConfig, devices } from '@playwright/test'

const deploymentUrl = process.env.DEPLOYMENT_URL
const protectionBypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET

if (!deploymentUrl) {
  throw new Error(
    'DEPLOYMENT_URL이 없습니다. 예: DEPLOYMENT_URL=https://preview.example.com pnpm test:smoke',
  )
}

let baseURL: string
try {
  const parsed = new URL(deploymentUrl)
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('http(s)가 아닙니다.')
  }
  baseURL = parsed.origin
} catch {
  throw new Error(
    `DEPLOYMENT_URL은 절대 http(s) URL이어야 합니다: ${deploymentUrl}`,
  )
}

export default defineConfig({
  testDir: 'e2e/smoke',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  workers: 3,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL,
    extraHTTPHeaders: protectionBypass
      ? { 'x-vercel-protection-bypass': protectionBypass }
      : undefined,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...devices['Desktop Chrome'],
  },
})
