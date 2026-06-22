import comments from '@eslint-community/eslint-plugin-eslint-comments';
import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import importX from 'eslint-plugin-import-x';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
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
    },
    settings: {
      'import-x/resolver-next': [createTypeScriptImportResolver()],
      'import-x/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
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
        { devDependencies: ['vite.config.ts'] },
      ],

      '@eslint-community/eslint-comments/no-unlimited-disable': 'error',
      '@eslint-community/eslint-comments/require-description': 'error',
    },
  },
);
