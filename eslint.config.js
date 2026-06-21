export default [
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      'react-hooks': {},
      'prettier': {},
    },
    extends: ['plugin:prettier/recommended'],
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      /**
       * deps 누락 시 eslint-disable + 사유 주석을 강제
       * deps에서 빼기보다 의존을 안 하는 형태로 코드를 바꿔 stale closure 방지
       */
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
      'no-var': 'error',
      'prefer-const': 'error',
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
    },
  },
];
