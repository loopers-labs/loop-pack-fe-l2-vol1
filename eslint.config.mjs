import js from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import css from "@eslint/css";
import stylistic from "@stylistic/eslint-plugin";
import { defineConfig } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import customLint from "./customLint.mjs";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  { linterOptions: { noInlineConfig: true } },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { js, customLint },
    extends: ["js/recommended", "customLint/all"],
  },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,mts,cts,tsx}"],
    rules: {
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        { assertionStyle: "never" },
      ],
    },
  },
  {
    files: ["**/*.{jsx,tsx}"],
    extends: [pluginReact.configs.flat["jsx-runtime"]],
    rules: {
      "react-hooks/exhaustive-deps": "error",
      "react/no-danger": "error",
      // nextVitals는 off 하지만 보안상 명시적으로 error 유지
      "react/jsx-no-target-blank": "error",
    },
  },
  {
    files: ["**/*.css"],
    plugins: { css },
    language: "css/css",
    extends: ["css/recommended"],
    rules: {
      "css/no-invalid-properties": ["error", { allowUnknownVariables: true }],
      "css/use-baseline": [
        "error",
        { allowProperties: ["resize", "backdrop-filter"] },
      ],
    },
  },
  {
    // 개행 스타일 강제: if/for/while/do/switch/try, return 앞에 빈 줄을 둔다.
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { "@stylistic": stylistic },
    rules: {
      "@stylistic/padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: "*", next: "return" },
        {
          blankLine: "always",
          prev: "*",
          next: ["if", "for", "while", "do", "switch", "try"],
        },
      ],
    },
  },
  {
    // Playwright fixture 는 React가 아닌데도. fixture 콜백의 두 번째 인자 관례명 `use` 가
    // React 19 의 `use` 훅으로 오인돼 rules-of-hooks 오탐을 내기 때문에 e2e 에서만 off
    files: ["e2e/**"],
    rules: { "react-hooks/rules-of-hooks": "off" },
  },
  {
    // 계측 모듈은 콘솔 출력이 본래 동작이라 no-console 를 끈다:
    // consoleProvider 는 이벤트를 콘솔에 찍는 개발용 프로바이더이고, logger 는 프로바이더 실패를
    // console.error 로 남긴다. (noInlineConfig 라 인라인 disable 은 안 먹으므로 여기서 스코프로 끈다.)
    files: ["src/shared/analytics/**"],
    rules: { "no-console": "off" },
  },
  eslintConfigPrettier,
]);
