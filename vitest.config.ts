import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

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
  },
});
