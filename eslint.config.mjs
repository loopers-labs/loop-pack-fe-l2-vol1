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

  {
    // no-console allow-list의 첫 항목이다. 위 규칙 주석에 적힌 "의도적 로깅은
    // allow-list 합의 후 연다"에 해당한다. 규칙을 끄지 않고 파일과 메서드만 좁혀 연다.
    //
    // consoleProvider는 개발 중 이벤트를 눈으로 확인하는 용도라 콘솔 출력이 기능 자체다.
    // info만 연다.
    //
    // logger는 프로바이더의 초기화·전송 실패를 알린다. 계측 실패로 화면을 멈출 수는 없어
    // throw하지 않는 대신, 실패를 삼키면 이벤트가 오지 않는 원인을 찾을 수 없다. error만 연다.
    //
    // warn과 log는 두 파일 모두 닫아 둔다. 디렉터리 단위로 넓히지 않는 이유는, 나중에
    // src/analytics에 파일이 늘어도 예외가 자동으로 따라 붙지 않게 하기 위해서다.
    files: ['src/analytics/consoleProvider.ts'],
    rules: { 'no-console': ['error', { allow: ['info'] }] },
  },

  {
    files: ['src/analytics/logger.ts'],
    rules: { 'no-console': ['error', { allow: ['error'] }] },
  },

  {
    // 테스트 환경 규약의 자물쇠다. `.test.ts`는 node 환경에서, `.test.tsx`는 jsdom에서 돈다
    // (vitest.config.ts). 규약이 문서에만 있으면 DOM 테스트가 node 파일로 슬쩍 들어오고,
    // 그날부터 DOM이 필요 없는 테스트까지 브라우저 흉내 환경을 세우게 된다.
    files: ['**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@testing-library/*'],
              message:
                'DOM이 필요한 테스트는 jsdom 프로젝트가 맡는다. 파일 확장자를 .test.tsx로 바꾼다.',
            },
          ],
        },
      ],
    },
  },

  prettier,
)
