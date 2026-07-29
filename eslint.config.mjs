import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import next from '@next/eslint-plugin-next';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['.next', 'out', 'build', 'next-env.d.ts'] },

  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      react.configs.flat.recommended,
      react.configs.flat['jsx-runtime'],
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      react: { version: '19.2' },
    },
    plugins: {
      'react-hooks': reactHooks,
      '@next/next': next,
    },
    rules: {
      // Next 도메인 룰: typescript-eslint/react가 모르는 Next 고유 실수(next/image·<Link>·
      // next/script 등)를 잡는다. eslint-config-next 번들 대신 플러그인만 얹는다 — 번들이 내
      // recommendedTypeChecked와 겹쳐 규칙 우선순위가 불투명해지므로.
      // preset(recommended+core-web-vitals)은 통째 채택하고, Pages Router 전용이라 App Router에선
      // inert한 룰도 끄지 않는다(하이브리드 대비 + preset drift 방지).
      ...next.configs.recommended.rules,
      ...next.configs['core-web-vitals'].rules,

      // 심각도 결정(근거): core-web-vitals가 warn으로 두지만, 이건 성능 힌트가 아니라
      // 정확성 footgun(async client component는 의도대로 동작 안 함)이라 게이트에서 막는다.
      '@next/next/no-async-client-component': 'error',

      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',

      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      eqeqeq: 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },

  // 스타터 API 테스트 한정: Response.json()이 any를 반환한다(NextResponse<Body>의 Body가
  // json()에 안 이어짐). 검증은 expect가 하므로 no-unsafe-*만 끈다. 내 코드는 엄격도 유지.
  {
    files: ['src/app/api/**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
    },
  },

  eslintConfigPrettier,
);
