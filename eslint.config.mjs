import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundariesPlugin from "eslint-plugin-boundaries";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // 개인 커스텀 룰 (week-03에서 이식)
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": "error",
      "no-nested-ternary": "error",
      "no-multi-assign": "error",
      eqeqeq: "error",
      "no-else-return": "error",
      "no-eval": "error",
      "no-shadow": "off",
      "@typescript-eslint/no-shadow": "error",
      "no-template-curly-in-string": "error",
      "no-var": "error",
      "prefer-const": "error",
      "prefer-template": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "no-empty": ["error", { allowEmptyCatch: false }],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "no-magic-numbers": [
        "error",
        { ignore: [0, 1, -1, 100, 200, 400, 500] },
      ],
    },
  },

  // 테스트·API 데이터·mock 시나리오 파일은 magic number 허용
  {
    files: [
      "**/*.test.{ts,tsx}",
      "src/app/api/_data/**",
      "src/app/api/**/route.ts",
      "src/entities/product/api/products.ts",
      "src/_pages/home/api/home.ts",
    ],
    rules: {
      "no-magic-numbers": "off",
    },
  },

  // 콘솔에 찍는 게 존재 목적인 analytics 프로바이더는 no-console 허용
  {
    files: ["src/analytics/**"],
    rules: {
      "no-console": "off",
    },
  },

  // FSD 레이어 의존 방향 강제
  {
    plugins: { boundaries: boundariesPlugin },
    ignores: ["**/*.test.{js,jsx,ts,tsx}", "**/*.spec.{js,jsx,ts,tsx}"],
    settings: {
      "boundaries/elements": [
        { type: "app-data", pattern: "src/app/api/_data/*" },
        { type: "app", pattern: "src/app/*" },
        { type: "pages", pattern: "src/_pages/*" },
        { type: "widgets", pattern: "src/widgets/*" },
        { type: "features", pattern: "src/features/*" },
        { type: "entities", pattern: "src/entities/*" },
        { type: "shared", pattern: "src/shared/*" },
      ],
    },
    rules: {
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [
            { from: "app", allow: ["app-data", "pages", "widgets", "features", "entities", "shared"] },
            { from: "pages", allow: ["widgets", "features", "entities", "shared"] },
            { from: "widgets", allow: ["features", "entities", "shared"] },
            { from: "features", allow: ["entities", "shared"] },
            { from: "entities", allow: ["shared"] },
            { from: "shared", allow: [] },
            { from: "app-data", allow: ["shared"] },
          ],
        },
      ],
    },
  },

  // prettier와 충돌하는 eslint 룰 비활성화 — 반드시 마지막에 위치
  prettierConfig,

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/app/performance-lab/**",
  ]),
]);

export default eslintConfig;