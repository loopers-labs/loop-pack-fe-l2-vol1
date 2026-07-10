// ESLint v10 Flat Config — 정확성에 직결되면 error, false positive 여지나 DX 힌트는 warn.
// Next 전용 룰은 프레임워크 계약(라우팅·이미지·스크립트 로딩)이라 저자 프리셋(recommended)을
// 통째로 편입하고, 성능에 직결되는 2룰만 core-web-vitals 수준(error)으로 승격한다.

import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import next from '@next/eslint-plugin-next'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  { ignores: ['.next', 'out', 'node_modules', 'next-env.d.ts'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      // Next는 서버(route handler·RSC)와 클라이언트 코드가 한 트리에 섞인다.
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      '@next/next': next,
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

      // Next 프레임워크 계약 룰 — 프레임워크가 정의한 오사용을 저자가 제일 잘 안다.
      ...next.configs.recommended.rules,
      // core-web-vitals 승격: <a> 내부 이동은 풀 리로드(클라 네비·prefetch 무효),
      // 동기 <script>는 파싱 블로킹. 둘 다 성능 결함이라 error.
      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/no-sync-scripts': 'error',
    },
  },

  {
    files: ['*.config.{ts,mjs,js}'],
    languageOptions: { globals: globals.node },
  },

  prettier,
)
