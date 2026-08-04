import { fileURLToPath } from 'node:url';
import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    // [AI] setupFiles는 test 옵션 안에 있어야 한다. 최상위에 두면 로드되지 않아
    // vitest.setup.ts의 jest-dom 매처 등록이 누락되고 타입 에러도 발생한다.
    setupFiles: ['./vitest.setup.ts'],
    // [AI] Playwright(e2e/) 스펙이 vitest에 잡히지 않도록 기본 exclude를 확장한다.
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
});
