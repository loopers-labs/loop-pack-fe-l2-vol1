// ESLint v10 Flat Config
//
// 이 설정의 원칙(1주차 과제 — docs/assignments/week-01.md):
//   "룰을 통째로 복붙하지 않는다. 각 룰을 '1차 하네스' 관점에서 보고
//    — 이 룰이 그럴듯하게 틀린 코드를 잡는가? error로 강제할 가치가 있는가? —
//    수용/거부를 스스로 판단하고, 그 근거를 설명할 수 있어야 한다."
//
// 그래서 recommended 프리셋을 그대로 펼치기보다, '왜 켜는지'를 아는 룰만
// 명시적으로 골라 켜고 각 룰 옆에 근거를 남긴다. 정확성에 직결되는 룰은 error로,
// false positive 여지가 있거나 DX 힌트인 룰은 warn으로 — 레벨 선택의 근거도 함께 적는다.
//
// 레벨 결정 근거는 docs/week1/setup-retrospective.md 단계 2에 회고로 남겨둔다.

import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  // ── 0) lint 대상에서 제외 ──────────────────────────────────────────────
  // 빌드 산출물·의존성은 우리가 작성/검증하는 코드가 아니다.
  { ignores: ['dist', 'node_modules'] },

  // ── 1) 베이스 권장 세트 ────────────────────────────────────────────────
  // js.recommended: 명백한 JS 실수(중복 case, 도달 불가 코드 등)를 잡는다.
  // tseslint.recommended: 타입 기반이 아닌(=빠른) TS 룰. 빌드와 별개로 IDE에서 즉시 돈다.
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ── 2) 우리가 직접 판단해 켠 핵심 룰 ───────────────────────────────────
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser, // 브라우저 런타임(window, document 등)
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // ── Hooks ──
      // rules-of-hooks: 훅 호출 순서가 조건/루프로 깨지면 React 내부 상태가 어긋나
      //   런타임에서 터진다. 사람 리뷰로는 놓치기 쉬운 결정적 결함 → error로 우회 불가.
      'react-hooks/rules-of-hooks': 'error',
      // exhaustive-deps: 의존성 누락은 stale closure(오래된 값 참조)를 만든다.
      //   다만 false positive 여지가 있어(정당하게 비우는 케이스 등) 발제 기본값인 warn으로 둔다.
      //   "왜 error가 아닌가" — 잘못된 강제가 더 위험한 우회(통째 disable)를 부를 수 있어서.
      //   경고가 쌓이지 않도록 PR에서 0 warning을 목표로 관리한다.
      'react-hooks/exhaustive-deps': 'warn',

      // ── 타입 안전성 ──
      // any는 타입 검사를 통째로 끄는 탈출구. Props/응답/이벤트에 퍼지면 TS를 쓰는 의미가 없다.
      '@typescript-eslint/no-explicit-any': 'error',
      // 미사용 변수는 TS가 잡게 하고(no-unused-vars off), TS 전용 룰로 일원화한다.
      // _ 접두 인자는 "의도적으로 안 쓴다"는 신호로 허용.
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // ── 정리 습관 (과제 의도 문제 #8: console.log 잔재) ──
      // 디버깅 잔재는 운영에 새어나가면 정보 노출/성능 문제가 된다. 본질은 "잔재 0".
      // 그래서 console.* 를 전면 차단(error)한다 — warn/error 콘솔조차 예외 두지 않는다.
      //   의도적 로깅이 필요해지면 그때 팀과 합의해 allow 목록을 연다.
      'no-console': 'error',
      'no-debugger': 'error',

      // ── 가독성 (과제 의도 문제 #7: 삼항 3중 중첩) ──
      // 중첩 삼항은 읽을 수 없다. early return 패턴으로 풀라는 신호.
      'no-nested-ternary': 'error',

      // ── 흔한 함정 ──
      // == 는 암묵적 형변환으로 "그럴듯하게 틀린" 비교를 만든다. 항상 === 를 쓴다.
      eqeqeq: ['error', 'always'],

      // ── Vite HMR 힌트 ──
      // 컴포넌트 파일에서 컴포넌트 외 값을 함께 export하면 Fast Refresh가 깨진다.
      // 이건 코드 '정확성'이 아니라 개발 경험(DX) 힌트라 warn으로 둔다 — error 강제 대상이 아니다.
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },

  // ── 3) Node 환경 설정 파일 ─────────────────────────────────────────────
  // vite.config.ts 등은 브라우저가 아닌 Node에서 돈다. node globals를 따로 준다.
  {
    files: ['*.config.{ts,mjs,js}'],
    languageOptions: { globals: globals.node },
  },

  // ── 4) Prettier와의 충돌 제거 (반드시 마지막) ──────────────────────────
  // 포맷(세미콜론/따옴표/줄바꿈)은 Prettier가 단독 담당한다.
  // ESLint의 스타일 룰을 꺼서 둘이 싸우지 않게 한다.
  prettier,
)
