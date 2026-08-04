import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import nextPlugin from "@next/eslint-plugin-next";
import prettier from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";

// 레이어 순위: 하위(shared) → 상위(_pages)
const FSD_LAYERS = ["shared", "entities", "features", "widgets", "_pages"];
const FSD_DEEP_IMPORT = ["@/entities/*/*", "@/features/*/*", "@/widgets/*/*", "@/_pages/*/*"];

const fsdHarness = [
  ...FSD_LAYERS.map((layer, rank) => ({
    files: [`src/${layer}/**/*.{ts,tsx}`],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              // 상위 레이어 금지 + 자기 레이어 포함 = 같은 레이어 슬라이스 간 직접 import 차단
              // (같은 슬라이스 내부는 상대경로 규칙이라 alias 전체 금지로 구현 가능)
              // shared는 비즈니스 슬라이스가 없으므로 자기 레이어 제외
              // app(라우팅·mock)은 최상위이므로 모든 FSD 레이어에서 import 금지
              group: [
                ...FSD_LAYERS.slice(layer === "shared" ? 1 : rank).map((l) => `@/${l}/*`),
                "@/app/*",
              ],
              message: `FSD: ${layer}에서 같은/상위 레이어를 import할 수 없습니다`,
            },
            {
              group: FSD_DEEP_IMPORT,
              message: "FSD: Public API(슬라이스 루트)로만 import하세요",
            },
            ...(layer === "shared"
              ? []
              : [
                  {
                    group: ["../../*"],
                    message: "FSD: 상대경로로 슬라이스 경계를 넘을 수 없습니다",
                  },
                ]),
          ],
        },
      ],
    },
  })),
  // 주의: 같은 rule의 options는 병합이 아니라 교체 — src/app/** 규칙을 추가하게 되면 이 객체가 반드시 뒤에 와야 함
  {
    files: ["src/app/api/**/*.ts"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/_pages/*", "@/widgets/*", "@/features/*", "@/shared/*"],
              message: "FSD: mock 백엔드는 자체 계약(_contract.ts)만 사용합니다",
            },
            {
              group: FSD_DEEP_IMPORT,
              message: "FSD: Public API(슬라이스 루트)로만 import하세요",
            },
            {
              group: ["@/entities/*"],
              allowTypeImports: true,
              message: "FSD: mock 백엔드는 entities에서 타입만 가져올 수 있습니다",
            },
          ],
        },
      ],
    },
  },
  // 같은 rule의 options는 교체이므로 mock 존 객체보다 반드시 뒤에 위치
  {
    files: ["src/app/api/**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/widgets/*", "@/features/*", "@/shared/*"],
              message: "FSD: mock 백엔드는 자체 계약(_contract.ts)만 사용합니다",
            },
            {
              group: ["@/entities/*", "@/_pages/*"],
              allowTypeImports: true,
              message: "FSD: mock 테스트는 entities·_pages에서 타입만 가져올 수 있습니다",
            },
            {
              group: ["@/entities/*/*"],
              message: "FSD: Public API(슬라이스 루트)로만 import하세요",
            },
          ],
        },
      ],
    },
  },
];

export default defineConfig([
  globalIgnores([".next/**", "out/**", "next-env.d.ts"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      react.configs.flat.recommended,
      react.configs.flat["jsx-runtime"],
    ],
    languageOptions: {
      ecmaVersion: "latest",
      globals: { ...globals.browser, ...globals.node },
    },
    settings: { react: { version: "detect" } },
    plugins: {
      "react-hooks": reactHooks,
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs["core-web-vitals"].rules,
      "@next/next/no-img-element": "warn",
      // @next/eslint-plugin-next 16.x 버그로 App Router에서 동작 불가
      "@next/next/no-html-link-for-pages": "off",
      "@next/next/no-sync-scripts": "error",
      "@next/next/no-async-client-component": "error",
      "@next/next/inline-script-id": "error",
      "@next/next/no-assign-module-variable": "error",

      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        { assertionStyle: "as", objectLiteralTypeAssertions: "never" },
      ],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      // 버려진 렌더나 중복 실행된 렌더가 쓴 값이 그대로 남는 것이 문제 -> effect 사용
      "react-hooks/refs": "error",
      // 렌더 중 생성된 값을 사후 변형하면 useMemo 재실행 시 조용히 초기화됨 -> ref 사용
      "react-hooks/immutability": "error",
      // 렌더 → effect → setState → 즉시 재렌더로 커밋마다 두 번 렌더
      "react-hooks/set-state-in-effect": "error",
      // 컴포넌트 내부 컴포넌트 정의 → 매 렌더 재마운트로 state 유실
      "react-hooks/static-components": "error",
      // 렌더링 중 Date.now() 같은 비순수 호출 시 SSR 하이드레이션 불일치 원인이 됨
      "react-hooks/purity": "error",
      // 렌더 중 모듈/전역 변수 변형 → SSR에서 요청 간 데이터 누출
      "react-hooks/globals": "error",
      // 본문에 setState -> 무한렌더루프
      "react-hooks/set-state-in-render": "error",
      // usememo의 콜백 오용방지
      "react-hooks/use-memo": "error",
      // 자식 렌더 에러는 부모 try/catch로 잡히지 않음 -> Error Boundary 사용
      "react-hooks/error-boundaries": "error",
      "react/prop-types": "off",
      "react/jsx-no-bind": [
        "error",
        { ignoreRefs: true, allowArrowFunctions: true },
      ],
    },
  },
  ...fsdHarness,
  prettier,
]);
