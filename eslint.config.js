import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": "error",
      "no-nested-ternary": "error",
      "id-length": ["error", { min: 2, exceptions: ["_", "i", "j"] }],
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
    },
  }
);
