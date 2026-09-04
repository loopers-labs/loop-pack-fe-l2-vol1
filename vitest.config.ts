import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// 환경 분리: DOM이 필요한 테스트만 jsdom에서 돈다.
// 파일명 규칙 `*.dom.test.*`가 유일한 기준 — 확장자로는 가를 수 없다
// (HeroSection.test.tsx는 .tsx지만 renderToStaticMarkup이라 DOM이 필요 없다).
// Vitest 4에는 environmentMatchGlobs가 없으므로 projects로 나눈다.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['src/**/*.dom.test.{ts,tsx}'],
        },
      },
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['src/**/*.dom.test.{ts,tsx}'],
          setupFiles: ['./vitest.setup.dom.ts'],
          // 앱은 클라이언트에서 상대 경로로 요청한다(shared/api/base-url).
          // base URL이 없으면 그 요청이 해석되지 않아 MSW가 가로챌 대상 자체가 없다.
          environmentOptions: { jsdom: { url: 'http://localhost:3000' } },
        },
      },
    ],
  },
});
