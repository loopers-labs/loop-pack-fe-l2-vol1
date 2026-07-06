import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import reactHooks from "eslint-plugin-react-hooks";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintComments from "@eslint-community/eslint-plugin-eslint-comments";
import react from "eslint-plugin-react";

const eslintConfig = defineConfig([
  // Next 전용 룰 — core-web-vitals + @next/eslint-plugin-next (import 플러그인 포함)
  ...nextVitals,
  ...nextTs,

  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),

  // 베이스 + TypeScript strict
  js.configs.recommended,
  tseslint.configs.strict,
  reactHooks.configs.flat.recommended,
  eslintConfigPrettier,

  // 공통 규칙
  {
    settings: {
      "import/resolver": { typescript: true, node: true },
    },
    plugins: {
      "eslint-comments": eslintComments,
      react,
    },
    rules: {
      "import/no-unresolved": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-expect-error": "allow-with-description",
          "ts-ignore": true,
          "ts-nocheck": true,
          "ts-check": false,
          minimumDescriptionLength: 10,
        },
      ],
      "eslint-comments/require-description": "error",
      "eslint-comments/no-unlimited-disable": "error",
      "no-empty": ["error", { allowEmptyCatch: false }],
      "react/no-danger": "error",
    },
  },

  // 타입 정보가 필요한 룰 — src만 대상
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
    },
  },
]);

export default eslintConfig;
