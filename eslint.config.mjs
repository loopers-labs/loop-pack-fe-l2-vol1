import comments from '@eslint-community/eslint-plugin-eslint-comments';
import js from '@eslint/js';
import next from '@next/eslint-plugin-next';
import stylistic from '@stylistic/eslint-plugin';
import vitest from '@vitest/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import boundaries from 'eslint-plugin-boundaries';
import importX from 'eslint-plugin-import-x';
import reactHooks from 'eslint-plugin-react-hooks';
import testingLibrary from 'eslint-plugin-testing-library';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '.next',
      'out',
      'build',
      'dist',
      'next-env.d.ts',
      '_workspace',
      '.claude',
      '.stryker-tmp',
      'reports',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      next.configs['core-web-vitals'],
      eslintConfigPrettier,
    ],
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'import-x': importX,
      '@eslint-community/eslint-comments': comments,
      '@stylistic': stylistic,
      boundaries,
    },
    settings: {
      'import-x/resolver-next': [createTypeScriptImportResolver()],
      'import-x/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      // boundaries가 @ alias를 해석할 때 쓰는 레거시 resolver 설정
      'import/resolver': {
        typescript: { alwaysTryTypes: true },
      },

      // FSD 레이어와 슬라이스 정의
      'boundaries/elements': [
        { type: 'entities', pattern: 'src/entities/*', capture: ['slice'] },
        { type: 'features', pattern: 'src/features/*', capture: ['slice'] },
        { type: 'pages', pattern: 'src/_pages/*', capture: ['slice'] },
        { type: 'app', pattern: 'src/app' },
        { type: 'shared', pattern: 'src/shared' },
      ],
    },
    rules: {
      // type, interface 등을 인식하는 ts 버전으로 교체
      'no-unused-vars': 'off',
      // ts 환경에 맞는 재선언을 감지하는 버전으로 교체
      '@typescript-eslint/no-redeclare': 'error',

      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/set-state-in-render': 'error',

      '@typescript-eslint/no-non-null-assertion': 'error',

      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',

      eqeqeq: 'error',
      'prefer-const': 'error',
      'no-var': 'error',

      // 로거가 따로 없어 최소 로깅을 위해 error, warn은 허용
      'no-console': ['error', { allow: ['warn', 'error'] }],

      'import-x/order': [
        'error',
        { 'newlines-between': 'always', alphabetize: { order: 'asc' } },
      ],
      'import-x/no-cycle': 'error',
      'import-x/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: [
            'next.config.ts',
            'eslint.config.mjs',
            'vitest.config.ts',
            'vitest.setup.ts',
            'vitest.msw.setup.ts',
            'playwright.config.ts',
            '**/*.test.{ts,tsx}',
            'tests/**',
            'e2e/**/*.spec.{ts,tsx}',
          ],
        },
      ],

      '@eslint-community/eslint-comments/no-unlimited-disable': 'error',
      '@eslint-community/eslint-comments/require-description': 'error',

      '@stylistic/padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
      ],

      // FSD 의존 규칙 하네스
      // 레이어는 자기보다 아래만 import하고, 같은 레이어의 다른 슬라이스를 직접 import하지 않는다(같은 슬라이스 내부는 검사 대상 아님).
      // 슬라이스는 루트 진입점으로만 연다. 예외는 entities 간 @x 공인 통로뿐이다.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/_pages/*/*'],
              message:
                '슬라이스 내부는 상대 경로, 외부는 루트 진입점을 사용합니다.',
            },
            {
              group: ['@/features/*/*'],
              message:
                '슬라이스 내부는 상대 경로, 외부는 루트 진입점을 사용합니다.',
            },
            {
              group: [
                '@/entities/*/model/**',
                '@/entities/*/ui/**',
                '@/entities/*/api/**',
                '@/entities/*/lib/**',
                '@/entities/*/config/**',
              ],
              message:
                '슬라이스 내부는 상대 경로, 외부는 루트 진입점을 사용합니다.',
            },
          ],
        },
      ],

      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          message: 'FSD 의존 규칙을 위반한 import입니다.',
          policies: [
            {
              from: { element: { type: 'app' } },
              allow: {
                to: [
                  { element: { type: 'pages', fileInternalPath: 'index.ts' } },
                  {
                    element: {
                      type: 'features',
                      fileInternalPath: 'index.ts',
                    },
                  },
                  {
                    element: { type: 'entities', fileInternalPath: 'index.ts' },
                  },
                  { element: { type: 'shared' } },
                ],
              },
            },
            {
              from: { element: { type: 'pages' } },
              allow: {
                to: [
                  {
                    element: {
                      type: 'features',
                      fileInternalPath: 'index.ts',
                    },
                  },
                  {
                    element: { type: 'entities', fileInternalPath: 'index.ts' },
                  },
                  { element: { type: 'shared' } },
                ],
              },
            },
            {
              from: { element: { type: 'features' } },
              allow: {
                to: [
                  {
                    element: { type: 'entities', fileInternalPath: 'index.ts' },
                  },
                  { element: { type: 'shared' } },
                ],
              },
            },
            {
              from: { element: { type: 'entities' } },
              allow: {
                to: [
                  {
                    element: {
                      type: 'entities',
                      fileInternalPath:
                        '@x/{{ from.element.captured.slice }}.ts',
                    },
                  },
                  { element: { type: 'shared' } },
                ],
              },
            },
          ],
        },
      ],
    },
  },
  {
    // 테스트 인프라는 레이어 밖이라 슬라이스 진입점 규칙을 적용하지 않는다
    files: ['vitest.setup.ts', 'tests/**'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    // 테스트 규칙 하네스 — .claude/rules/testing.md 중 기계로 잡을 수 있는 것.
    // 비활성화·단언 없음·truthiness 단언은 문장 규칙이 아니라 린트 에러로 막는다.
    files: ['{src,tests}/**/*.test.{ts,tsx}'],
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/no-disabled-tests': 'error',
      'vitest/no-focused-tests': 'error',
      'vitest/no-commented-out-tests': 'error',
      'vitest/expect-expect': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'CallExpression[callee.property.name=/^(toBeTruthy|toBeDefined)$/]',
          message: '값 · 개수 · 텍스트로 단언합니다.',
        },
        {
          selector:
            "CallExpression[callee.property.name='toBeNull'][callee.object.property.name='not']",
          message: '값 · 개수 · 텍스트로 단언합니다.',
        },
      ],
    },
  },
  {
    // RTL 규칙 — jsdom 테스트와 렌더 헬퍼. 구현 세부사항 쿼리와 잘못된 비동기 대기를 막는다.
    files: ['{src,tests}/**/*.dom.test.{ts,tsx}', 'tests/**/*.tsx'],
    plugins: { 'testing-library': testingLibrary },
    rules: testingLibrary.configs['flat/react'].rules,
  },
  {
    // 스타터가 제공한 mock 백엔드와 이벤트 로거는 과제 판별 대상이라 수정하지 않고 스타일 룰만 끈다.
    files: ['src/app/api/**', 'src/analytics/**'],
    rules: {
      'import-x/order': 'off',
      '@stylistic/padding-line-between-statements': 'off',
      'boundaries/dependencies': 'off',
      'no-restricted-imports': 'off',
    },
  },
  {
    // 스타터 테스트는 단언 하네스 룰(위 테스트 블록)의 대상이 아니다.
    files: ['src/app/api/**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    // 콘솔에 찍는 게 역할인 프로바이더라 이 파일만 허용한다.
    files: ['src/analytics/consoleProvider.ts'],
    rules: {
      'no-console': 'off',
    },
  },
);
