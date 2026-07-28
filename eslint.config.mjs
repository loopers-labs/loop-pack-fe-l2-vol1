import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated/build artifacts & cache
    "coverage/**",
    ".eslintcache",
  ]),
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off",
      "@typescript-eslint/no-unused-vars": ["error", { ignoreRestSiblings: true }],
      "no-console": ["error", { allow: ["error"] }],
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "react-hooks/rules-of-hooks": "error",
    },
  },
]);

export default eslintConfig;
