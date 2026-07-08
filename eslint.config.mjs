// ESLint flat config — AI 협업 하네스 (1주차 이식 → 4주차 Next 대응)
import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintComments from "@eslint-community/eslint-plugin-eslint-comments";
import nextPlugin from "@next/eslint-plugin-next";

export default defineConfig(
  { ignores: ["dist", "node_modules", ".next", "next-env.d.ts"] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      // Next: 클라이언트(브라우저) + 서버 컴포넌트/route(Node) 두 런타임 공존
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      "react-hooks": reactHooks,
      "@eslint-community/eslint-comments": eslintComments,
      "@next/next": nextPlugin,
    },
    rules: {
      // Next 전용 룰 (아래 "왜" 참고)
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,

      // ── 1주차 정확성 룰 (그대로 유지) ──
      "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
      "@eslint-community/eslint-comments/no-use": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      "react-hooks/set-state-in-effect": "error",
      "react-hooks/immutability": "error",
      "react-hooks/static-components": "error",
      "react-hooks/refs": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      eqeqeq: ["error", "always"],
      "no-empty": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
      curly: ["error", "all"],
      "prefer-const": "error",
    },
  },

  eslintConfigPrettier,
);
