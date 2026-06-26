import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import css from "@eslint/css";
import { defineConfig } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import customLint from "./customLint.ts";

export default defineConfig([
  { ignores: ["dist"] },
  { linterOptions: { noInlineConfig: true } },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { js, customLint },
    extends: ["js/recommended", "customLint/all"],
    languageOptions: { globals: globals.browser },
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
    extends: [
      pluginReact.configs.flat.recommended,
      pluginReact.configs.flat["jsx-runtime"],
      reactHooks.configs.flat.recommended,
    ],
    settings: { react: { version: "19.2" } },
    rules: {
      "react-hooks/exhaustive-deps": "error",
      "react/no-danger": "error",
    },
  },
  {
    files: ["**/*.css"],
    plugins: { css },
    language: "css/css",
    extends: ["css/recommended"],
    rules: {
      "css/no-invalid-properties": ["error", { allowUnknownVariables: true }],
    },
  },
  eslintConfigPrettier,
]);
