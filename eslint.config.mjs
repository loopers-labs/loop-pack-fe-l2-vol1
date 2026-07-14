import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import eslintConfigPrettier from 'eslint-config-prettier'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Vite 시절 빌드 산출물 (남아있는 경우 대비)
    'dist/**',
  ]),
  // week-03에서 적용했던 규칙 이관
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'react-hooks/exhaustive-deps': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: {
            attributes: false,
          },
        },
      ],
      '@typescript-eslint/await-thenable': 'error',
      'eqeqeq': ['error', 'always'],
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      // code-style.md: ! 단언 회피 규칙을 lint로 강제
      '@typescript-eslint/no-non-null-assertion': 'error',
      // `as Type` / `<Type>value` 타입 단언으로 타입 검사를 우회하지 않는다.
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
    },
  },
  eslintConfigPrettier,
])

export default eslintConfig
