import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Stryker 전용 설정 — node 프로젝트(단위 테스트)만 돈다.
// 8주차 RFC "Advanced — Stryker 범위": 통합 테스트(jsdom+MSW)를 넣으면 변형 하나마다 환경이 다시 서므로 제외.
// 본 설정(vitest.config.ts)의 projects 배열은 Stryker vitest-runner가 프로젝트 하나만 고를 수 없어 파일을 나눴다.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['src/**/*.dom.test.{ts,tsx}', 'node_modules/**'],
  },
});
