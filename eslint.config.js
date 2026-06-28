import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    files: ['**/*.{ts,tsx}'],
    // eslint/js recommded + typescript-eslint recommended
    // 서로 상호보완적인 규칙
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: {
      react,
      'react-hooks': reactHooks
    },
    languageOptions: {
      // tseslint custom rule 추가를 위한 tsconfig 경로 명시
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      // React 의 기대 코드 흐름인 "컴포넌트가 렌더링될 때마다 정확히 동일한 훅이 정확히 동일한 순서로 호출" 과 일치시키기 위함
      'react-hooks/rules-of-hooks': 'error',
      // 의도적으로 남기는 케이스가 있기 때문에 권장사항에 따라 warn
      // 단, 'stale closure' 문제에 유의해서 스스로 코드 변경 필요성을 판단해야함
      'react-hooks/exhaustive-deps': 'warn',
      // 배열 index를 key로 쓰면 리스트 변경 시 잘못된 재사용·상태 꼬임 발생 — AI가 흔히 저지르는 실수
      'react/no-array-index-key': 'error',
      // 렌더 함수 안에서 컴포넌트를 정의하면 매 렌더마다 재생성되어 unmount/remount — 결정적으로 잡히는 안티패턴
      'react/no-unstable-nested-components': 'error',
      // 타입 단언 전면 금지 — `value as X`와 꺾쇠 `<X>value` 둘 다 차단(as const는 예외). 단언으로 덮지 말고 타입 가드/제네릭으로 좁혀라
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      // non-null 단언(x!) 금지 — strictNullChecks가 잡은 null 위험을 ! 한 글자로 무력화하는 우회로 차단. if 가드로 좁혀라
      '@typescript-eslint/no-non-null-assertion': 'error',
      // == 의 암묵 타입 변환(0 == '', null == undefined 등) 비교 버그 차단 — 항상 ===/!== 강제
      eqeqeq: 'error',
      // 의미없는 이름 금지, 코드 수정 빈번할 경우 고려하여 warn
      'id-denylist': ['warn', 'data', 'temp', 'tmp', 'flag', 'val', 'foo', 'bar', 'err'],
      // 1글자 식별자 금지(warn). for 카운터 관례(i·j·k)와 throwaway(_)는 허용.
      // no-restricted-syntax와 다르게 콜백 파라미터(map(x =>))도 포함하여 더 넓게 잡음
      'id-length': ['warn', { min: 2, exceptions: ['i', 'j', 'k', '_'] }],
      // 핸들러 네이밍 — onXXX는 props 전달용으로 예약, 선언하는 핸들러는 handleXXX
      // 쉽게 지킬 수 있는 규칙이므로 error로 지정
      'no-restricted-syntax': [
        'error',
        {
          selector: 'VariableDeclarator[id.name=/^on[A-Z]/]',
          message: '핸들러 함수는 handleXXX로 명명하세요. onXXX는 props 전달용으로 예약되어 있습니다.'
        },
        {
          selector: 'FunctionDeclaration[id.name=/^on[A-Z]/]',
          message: '핸들러 함수는 handleXXX로 명명하세요. onXXX는 props 전달용으로 예약되어 있습니다.'
        }
      ]
    }
  },
  {
    // 타입 정보가 필요한 룰은 tsconfig가 커버하는 src 범위로만 한정한다.
    // 룰 적용 대상(files)과 타입정보 제공 대상(tsconfig include)을 일치시켜,
    // 어느 tsconfig에도 안 잡히는 파일에서 parser 에러로 lint 전체가 깨지는 것을 방지.
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // 비동기 함수 예외 대응
      '@typescript-eslint/no-floating-promises': 'warn'
    }
  }
);
