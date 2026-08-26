import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

/**
 * 환경은 파일 이름이 정한다. `*.dom.test.*`만 jsdom, 나머지는 node.
 * 확장자는 문법(JSX 유무)만 뜻한다.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    // tsconfig의 "@/*" -> "./src/*" 별칭을 Vitest에도 동일하게 적용
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@tests': fileURLToPath(new URL('./tests', import.meta.url)),
    },
  },
  test: {
    restoreMocks: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          setupFiles: ['./vitest.msw.setup.ts'],
          include: ['{src,tests}/**/*.test.{ts,tsx}'],
          exclude: [...configDefaults.exclude, '**/*.dom.test.*'],
        },
      },
      {
        extends: true,
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          setupFiles: ['./vitest.msw.setup.ts', './vitest.setup.ts'],
          include: ['{src,tests}/**/*.dom.test.{ts,tsx}'],
        },
      },
    ],
  },
});
