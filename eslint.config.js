import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import eslintComments from '@eslint-community/eslint-plugin-eslint-comments';
import react from 'eslint-plugin-react';

export default tseslint.config(
  { ignores: ['dist', 'eslint.config.js'] },

  js.configs.recommended,
  tseslint.configs.strict, // strict이 async/any 전파까지 잡아줌, strictTypeChecked보다 빠름
  reactHooks.configs.flat.recommended, // 1주차 발제에서 나왔던 rules-of-hooks 문제 / exhaustive-deps
  reactRefresh.configs.vite, // HMR 깨는 export 잡는 용도
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  eslintConfigPrettier, // 포맷은 prettier한테 맡기고 충돌 룰 끄기

  // 공통 규칙
  {
    settings: {
      'import/resolver': { typescript: true, node: true },
    },
    plugins: {
      'eslint-comments': eslintComments,
      react,
    },
    rules: {
      // 없는 패키지 import 방지, AI가 환각으로 만들어낸 패키지 걸러내는 용도
      'import/no-unresolved': 'error',

      // any 금지 strict에 이미 들어있는데 명시적으로 남겨두는 게 좋다 해서 남겨둠
      '@typescript-eslint/no-explicit-any': 'error',

      // @ts-ignore 쓰고 싶으면 @ts-expect-error + 이유 10자 이상 달아야 함
      // ts-ignore로 침묵시키는 거 막으려고
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': true,
          'ts-nocheck': true,
          'ts-check': false,
          minimumDescriptionLength: 10,
        },
      ],

      // eslint-disable 쓸 거면 왜 끄는지 설명을 달아야 함
      'eslint-comments/require-description': 'error',
      'eslint-comments/no-unlimited-disable': 'error',

      // 내용없는 catch 금지 에러 삼키고 넘어가는 것 방지하는 용도
      'no-empty': ['error', { allowEmptyCatch: false }],

      // dangerouslySetInnerHTML/XSS 위험, 쓸 일이 있더라도 일단 error로
      'react/no-danger': 'error',
    },
  },

  // no-floating-promises는 타입 정보가 있어야 작동
  // 전체 파일에 걸면 느려지니까 src만 대상으로 범위 좁힘
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // 처리 안 된 Promise가 떠다니는 거 금지
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
    },
  },
);
