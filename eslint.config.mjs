import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

const eslintConfig = defineConfig([
  // Next.js 전용 룰 — eslint-config-next가 @next/eslint-plugin-next를 내장
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
      "no-magic-numbers": ["error", { ignore: [0, 1, -1, 100] }],
    },
  },

  // prettier와 충돌하는 eslint 룰 비활성화 — 반드시 마지막에 위치
  prettierConfig,

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
