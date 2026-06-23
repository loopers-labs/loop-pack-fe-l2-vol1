import js from "@eslint/js";
import globals from "globals";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  { ignores: ["dist", "node_modules"] },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactPlugin.configs.flat["jsx-runtime"],
    ],
    plugins: {
      "react-hooks": reactHooks,
    },
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: "detect" } },
    linterOptions: {
      noInlineConfig: true, // eslint-disable 인라인 우회 금지
    },
    rules: {
      // ── TypeScript ──
      "@typescript-eslint/no-explicit-any": "error", // any 사용 = 타입 안전성 포기; 고유 타입 선언 원칙
      "@typescript-eslint/ban-ts-comment": "error", // ts-ignore/ts-nocheck는 타입 검사 우회 — 근본 원인 수정 원칙
      "@typescript-eslint/no-unused-vars": "error", // 미사용 변수는 커밋 전 전수 제거 원칙

      // ── JS 기본 ──
      eqeqeq: ["error", "always"], // == 대신 === 강제 — 타입 강제변환 버그 방지
      "prefer-const": "error", // 재할당 없는 변수는 const 강제
      "no-var": "error", // var 금지 — 블록 스코프 보장
      "no-empty": "error", // 빈 catch 블록 금지 — 에러 명시적 처리 원칙
      "no-console": ["error", { allow: ["warn", "error"] }], // 디버깅용 console.log 커밋 금지 (warn/error는 허용)

      // ── React ──
      "react/jsx-key": "error", // 리스트 key 누락 → 리렌더링 오류 직결

      // ── Hooks: 위반 시 런타임 버그 직결이므로 error ──
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error", // 의존성 누락 = stale closure 버그
      "react-hooks/set-state-in-effect": "error", // useEffect 안 setState 오남용 방지
      "react-hooks/set-state-in-render": "error", // 렌더 본문에서 setState 직접 호출 → 무한 리렌더 방지
    },
  },
  // eslintConfigPrettier는 별도 진입점으로 마지막에 배치해야 rules 키를 덮어쓰지 않음
  eslintConfigPrettier,
);
