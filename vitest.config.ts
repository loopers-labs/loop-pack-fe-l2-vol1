import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

/**
 * 환경은 파일 이름이 정한다. `*.dom.test.*`만 jsdom, 나머지는 node.
 * 확장자는 문법(JSX 유무)만 뜻한다.
 *
 * unit/integration은 책임이 정한다.
 * 화면·상태·API의 연결과 CLI 프로세스 실행 검사는 integration으로 열거한다.
 * 나머지는 unit에 포함한다. 각 그룹의 CI 실행 정책은 quality.yml에서 정한다.
 */
const INTEGRATION_NODE_TESTS = [
  'tests/**/*.test.{ts,tsx}',
  'src/_pages/**/*.test.{ts,tsx}',
  'src/app/api/**/route.test.ts',
];

const INTEGRATION_DOM_TESTS = [
  'tests/**/*.dom.test.{ts,tsx}',
  'src/_pages/**/*.dom.test.{ts,tsx}',
  'src/entities/**/*-store.dom.test.ts',
  // features는 unit성 hook 테스트도 섞이는 레이어라 폴더 glob 대신 파일을 열거한다.
  'src/features/auth/ui/LoginForm.dom.test.tsx',
  'src/features/auth/ui/LogoutButton.dom.test.tsx',
  'src/features/product/model/search-params.dom.test.tsx',
];

const INTEGRATION_CLI_TESTS = [
  'scripts/week-10-ci/check-env-build.test.ts',
  'scripts/week-10-ci/check-budget.test.ts',
  'scripts/week-10-ci/pr-comment.test.ts',
];

const INTEGRATION_TESTS = [
  ...INTEGRATION_NODE_TESTS,
  ...INTEGRATION_DOM_TESTS,
  ...INTEGRATION_CLI_TESTS,
];

const NODE_SETUP = ['./vitest.msw.setup.ts'];
const JSDOM_SETUP = ['./vitest.msw.setup.ts', './vitest.setup.ts'];

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
          name: 'unit-node',
          environment: 'node',
          setupFiles: NODE_SETUP,
          include: ['{scripts,src,tests}/**/*.test.{ts,tsx}'],
          exclude: [
            ...configDefaults.exclude,
            '**/*.dom.test.*',
            ...INTEGRATION_TESTS,
          ],
        },
      },
      {
        extends: true,
        test: {
          name: 'unit-jsdom',
          environment: 'jsdom',
          setupFiles: JSDOM_SETUP,
          include: ['{src,tests}/**/*.dom.test.{ts,tsx}'],
          exclude: [...configDefaults.exclude, ...INTEGRATION_TESTS],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration-cli',
          environment: 'node',
          include: INTEGRATION_CLI_TESTS,
        },
      },
      {
        extends: true,
        test: {
          name: 'integration-node',
          environment: 'node',
          setupFiles: NODE_SETUP,
          include: INTEGRATION_NODE_TESTS,
          exclude: [...configDefaults.exclude, '**/*.dom.test.*'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration-jsdom',
          environment: 'jsdom',
          setupFiles: JSDOM_SETUP,
          include: INTEGRATION_DOM_TESTS,
          exclude: [...configDefaults.exclude],
        },
      },
    ],
  },
});
