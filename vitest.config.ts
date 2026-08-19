import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

/**
 * 확장자가 곧 환경이다. `.ts`는 node, `.tsx`는 jsdom.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    // tsconfig의 "@/*" -> "./src/*" 별칭을 Vitest에도 동일하게 적용
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    restoreMocks: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          // JSX를 쓰지만 react-dom/server만 써서 DOM이 필요 없어 예외처리
          include: ['src/**/*.test.ts', 'src/_pages/home/ui/HomePage.test.tsx'],
        },
      },
      {
        extends: true,
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          setupFiles: ['./vitest.setup.ts'],
          include: ['src/**/*.test.tsx', 'tests/**/*.test.tsx'],
          exclude: [
            ...configDefaults.exclude,
            'src/_pages/home/ui/HomePage.test.tsx',
          ],
        },
      },
    ],
  },
});
