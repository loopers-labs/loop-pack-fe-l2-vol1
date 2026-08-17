import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// 테스트 대상 = docs/rfc/week08-test-plan.md 1단계에서 "단위"로 분류한 순수 로직만(검증대상 1·2·3-1·3-2·3-3·3-4).
// base(vitest.config.ts)는 전체를 include 하므로 여기서 단위 테스트 파일만 명시한다.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./src/__tests__/setup.ts"],
    include: [
      "src/__tests__/cartWishlistCount.test.ts",
      "src/shared/lib/createIdSetStore.test.ts",
      "src/entities/product/model/productListQuery.test.ts",
      "src/_pages/products/model/productListMetadata.test.ts",
      "src/shared/api/apiError.test.ts",
    ],
  },
});
