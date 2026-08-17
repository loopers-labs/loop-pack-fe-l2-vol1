const config = {
  testRunner: "vitest",
  // pnpm 환경에선 러너 플러그인 자동 탐색이 안 될 수 있어 명시한다(지침 팁의 "vitest 플러그인" 경고 회피).
  plugins: ["@stryker-mutator/vitest-runner"],
  vitest: { configFile: "vitest.stryker.config.ts" },
  coverageAnalysis: "perTest",

  // 변형 대상 = docs/rfc/week08-test-plan.md 1단계에서 "단위"로 분류한 순수 로직만(검증대상 1·2·3-1·3-2·3-3·3-4).
  mutate: [
    "src/shared/lib/createIdSetStore.ts",
    "src/entities/product/model/productListQuery.ts",
    "src/_pages/products/model/productListMetadata.ts",
    "src/shared/api/apiError.ts",
  ],

  reporters: ["html", "clear-text", "progress"],
  htmlReporter: { fileName: "test-results/stryker/mutation.html" },
};

export default config;
