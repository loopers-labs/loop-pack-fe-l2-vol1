// ESLint flat config — AI 협업 1차 하네스
//
// 목적: AI가 쏟아내는 "그럴듯하게 틀린" 코드를 커밋 전에 결정적으로 차단한다.
// 채택 기준: 각 룰은 "이게 *잘못된* 코드를 잡는가? error로 강제할 가치가 있는가?"를 통과해야만 켠다.
// 순수 스타일(따옴표·줄바꿈 등 '모양')은 여기 넣지 않고 Prettier에 맡긴다(맨 끝 eslint-config-prettier).
//
// react-hooks v7 주의: v7의 recommended 프리셋은 React Compiler 기반 룰까지 통째로 묶는다.
// 디폴트를 통으로 펼치지 않고, 과제가 말하는 "좋은 코드 기준"에 매핑되는 룰만 골라 켠다.

import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default defineConfig(
  // 린트 대상 제외: 빌드 산출물·의존성
  { ignores: ["dist", "node_modules"] },

  // 베이스라인: 객관적으로 깨진 JS/TS (no-undef, no-dupe-keys, no-unreachable, no-misused-new ...)
  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser, // 브라우저 런타임 전역(window, document ...)
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      // ── React: 훅/렌더 정확성 ──
      // (recommended를 통으로 켜지 않고, 과제 "좋은 코드 기준"에 직결되는 것만 선별)
      "react-hooks/rules-of-hooks": "error", // 훅 호출 순서 규칙 — 조건/반복 안에서 훅 호출 금지
      "react-hooks/exhaustive-deps": "error", // 의존성 배열 누락 = stale closure(그럴듯하게 틀린 버그). warn→error 승격
      "react-hooks/set-state-in-effect": "error", // useEffect로 상태 "동기화" 금지 = 과제 최중요 패턴("파생값은 계산한다")의 기계 강제
      "react-hooks/immutability": "error", // 렌더 중 props/state 직접 변조 금지
      "react-hooks/static-components": "error", // 컴포넌트 안에서 컴포넌트 정의 금지(매 렌더 새 타입 → 상태 날아감, AI 단골 실수)
      "react-hooks/refs": "error", // 렌더 도중 ref 읽기/쓰기 금지(렌더는 순수해야)
      // 보류: react-hooks/use-memo, preserve-manual-memoization, incompatible-library, globals
      //  → React Compiler 채택을 전제하는 룰. 컴파일러 없이 켜면 오탐/혼란. 컴파일러 도입 시 함께 켠다.

      // ── 타입 침묵 차단(AI가 타입체커를 끄고 지나가는 통로) ──
      "@typescript-eslint/no-explicit-any": "error", // any = 타입 안전망 우회 1순위 수단
      "@typescript-eslint/ban-ts-comment": "error", // ts-ignore 류 주석으로 타입에러 은폐 금지
      "no-unused-vars": "off", // base 룰은 끄고 TS 인지 버전으로 대체(타입 전용 import 오탐 방지)
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }, // _ 접두사 = "일부러 안 쓴다"는 명시적 신호
      ],

      // ── 숨은 버그·잔재 차단 ──
      eqeqeq: ["error", "always"], // == 암묵 형변환 footgun → === 강제
      "no-empty": "error", // 빈 블록(특히 빈 catch) = 에러 삼킴
      "no-console": ["error", { allow: ["warn", "error"] }], // console.log 디버깅 잔재 차단(warn/error는 허용)
      curly: ["error", "all"], // 무중괄호 if에 줄 추가하다 생기는 제어흐름 버그 예방
      "prefer-const": "error", // 재할당 없는 let = 의도와 코드 불일치
    },
  },

  // 맨 마지막: Prettier와 충돌하는 "모양" 룰을 전부 끈다(포맷은 Prettier 전담, ESLint는 품질만)
  eslintConfigPrettier,
);
