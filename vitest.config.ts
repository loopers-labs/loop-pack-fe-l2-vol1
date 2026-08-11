import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./src/__tests__/setup.ts"],
    // e2e/ 는 Playwright(@playwright/test) 전용 — vitest 가 집어가면 test 러너가 충돌한다.
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
