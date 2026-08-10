import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    passWithNoTests: true,
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: [
            "src/**/*.test.ts",
            "src/**/*.spec.ts",
            "!src/entities/cart/model/cartStore.test.ts",
            "!src/entities/wishlist/model/wishlistStore.test.ts",
            "!src/shared/lib/debounce/useDebouncedValue.test.ts",
          ],
        },
      },
      {
        extends: true,
        test: {
          name: "jsdom",
          environment: "jsdom",
          include: [
            "src/**/*.test.tsx",
            "src/**/*.spec.tsx",
            "src/entities/cart/model/cartStore.test.ts",
            "src/entities/wishlist/model/wishlistStore.test.ts",
            "src/shared/lib/debounce/useDebouncedValue.test.ts",
          ],
          setupFiles: ["./src/shared/config/vitest/setup.ts"],
        },
      },
    ],
  },
});
