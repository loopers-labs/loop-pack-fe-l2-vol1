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
      "css/use-baseline": ["error", { allowProperties: ["resize"] }],
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
  eslintConfigPrettier,
]);
