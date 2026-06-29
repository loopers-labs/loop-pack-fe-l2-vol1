// ESLint v10 Flat Config — recommended를 펼치지 않고 룰을 골라 켠다.
// 정확성에 직결되면 error, false positive 여지나 DX 힌트는 warn.

import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    settings: { react: { version: '19.2' } },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      // warn: 의도적 빈 deps가 있어 error 강제는 통째 disable 남용을 부른다. 누적은 --max-warnings=0이 막는다.
      'react-hooks/exhaustive-deps': 'warn',

      '@typescript-eslint/no-explicit-any': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // 전면 차단 — 의도적 로깅은 allow-list 합의 후 연다.
      'no-console': 'error',
      'no-debugger': 'error',
      'no-nested-ternary': 'error',
      eqeqeq: ['error', 'always'],

      // 매 렌더 새 컴포넌트 타입이 생겨 자식이 리마운트된다. 사실상 항상 버그.
      'react/no-unstable-nested-components': 'error',
      // warn: 정적 리스트에선 정당해 error는 과하다.
      'react/no-array-index-key': 'warn',

      // warn: 코드 정확성이 아닌 HMR 힌트.
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },

  {
    files: ['*.config.{ts,mjs,js}'],
    languageOptions: { globals: globals.node },
  },

  prettier,
)
