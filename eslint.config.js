import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: {
      'react-hooks': reactHooks
    },
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      // 타입 단언(as) 지양 — 타입 가드·제네릭·정확한 타입 정의로 대체. (as const는 항상 허용)
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      // 의미없는 이름 금지 (error는 의도적으로 제외 — 전체 단어는 허용)
      'id-denylist': ['error', 'data', 'temp', 'tmp', 'flag', 'val', 'foo', 'bar', 'err'],
      // 핸들러 네이밍 — onXXX는 props 전달용으로 예약, 선언하는 핸들러는 handleXXX
      'no-restricted-syntax': [
        'error',
        {
          selector: 'VariableDeclarator[id.name=/^on[A-Z]/]',
          message: '핸들러 함수는 handleXXX로 명명하세요. onXXX는 props 전달용으로 예약되어 있습니다.'
        },
        {
          selector: 'FunctionDeclaration[id.name=/^on[A-Z]/]',
          message: '핸들러 함수는 handleXXX로 명명하세요. onXXX는 props 전달용으로 예약되어 있습니다.'
        },
        {
          // 1글자 변수명 금지. 단 for 헤더의 카운터(i 등)는 관례로 허용.
          // catch(e)·콜백 파라미터(map(e=>))는 VariableDeclarator가 아니라 자동 제외됨.
          selector: 'VariableDeclarator[id.name=/^[a-z]$/i]:not(ForStatement > VariableDeclaration > VariableDeclarator):not(ForOfStatement > VariableDeclaration > VariableDeclarator):not(ForInStatement > VariableDeclaration > VariableDeclarator)',
          message: '1글자 변수명 금지 — 역할이 드러나는 이름을 쓰세요.'
        }
      ]
    }
  }
);
