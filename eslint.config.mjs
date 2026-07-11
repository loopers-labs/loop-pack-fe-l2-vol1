import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintComments from "@eslint-community/eslint-plugin-eslint-comments";
import eslintConfigPrettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@eslint-community/eslint-comments": eslintComments,
    },
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
    rules: {
      "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
      "@typescript-eslint/no-non-null-assertion": "error",
      "@eslint-community/eslint-comments/require-description": ["error", { ignore: [] }],
      "@eslint-community/eslint-comments/no-unlimited-disable": "error",
      "react-hooks/exhaustive-deps": "error",
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
      "no-restricted-syntax": [
        "error",
        {
          selector: "ExportAllDeclaration",
          message:
            "배럴은 순수 named re-export만 — `export *` 금지. `export { A, B } from './x'`로.",
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  eslintConfigPrettier,
]);

export default eslintConfig;
