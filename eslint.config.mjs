// ESLint v10 Flat Config — 정확성에 직결되면 error, false positive 여지나 DX 힌트는 warn.
// Next 전용 룰은 프레임워크 계약이라 저자 프리셋(core-web-vitals)을 통째로 편입한다.
// 수동 승격 대신 프리셋 스프레드를 쓰는 이유: 플러그인 업그레이드 시 승격 목록을 자동 추적.

import { defineConfig } from 'eslint/config'
import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import importPlugin from 'eslint-plugin-import'
import next from '@next/eslint-plugin-next'
import prettier from 'eslint-config-prettier'

export default defineConfig(
  {
    ignores: [
      '.next',
      'out',
      'storybook-static',
      'node_modules',
      'next-env.d.ts',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    // js·jsx·mjs도 포함 — ts/tsx만 스코프하면 .jsx는 어떤 config에도 안 걸려 무검사로 통과한다.
    files: ['**/*.{ts,tsx,js,jsx,mjs}'],
    languageOptions: {
      // Next는 서버(route handler·RSC)와 클라이언트 코드가 한 트리에 섞인다.
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      import: importPlugin,
      '@next/next': next,
    },
    // 'detect'가 정석이지만 eslint 10에선 plugin-react가 구 API(getFilename)를 호출해
    // 크래시한다(직접 확인). 플러그인이 v10을 지원하면 detect로 되돌린다.
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
      // key 누락은 재정렬 시 상태가 엉뚱한 아이템에 붙는 프로덕션 버그 — error.
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      // children은 prop이 아니라 JSX 중첩으로 — prop으로 주면 중첩 내용을 조용히 덮는다.
      'react/no-children-prop': 'error',

      // 접근성 — aria 오사용·alt 누락은 스크린리더 사용자에게 기능 결함.
      // warn이지만 --max-warnings=0 게이트가 누적을 차단한다.
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/aria-props': 'warn',
      'jsx-a11y/aria-proptypes': 'warn',
      'jsx-a11y/aria-unsupported-elements': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'warn',
      'jsx-a11y/role-supports-aria-props': 'warn',

      // 익명 default export는 DevTools·Fast Refresh 네이밍과 스택트레이스를 망친다.
      'import/no-anonymous-default-export': 'warn',

      // Next 프레임워크 계약 룰 — recommended + 성능 직결 2룰이 error인 저자 프리셋.
      // (no-html-link-for-pages는 pages/ 전용이라 App Router에선 침묵한다.
      //  App Router 커버가 아니라 프리셋 추적이 목적이다.)
      ...next.configs['core-web-vitals'].rules,
    },
  },

  prettier,
)
