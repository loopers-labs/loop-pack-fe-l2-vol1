import { defineConfig, defaultExclude } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "happy-dom",
    setupFiles: ["./mocks/setup.ts"],
    exclude: [...defaultExclude, "e2e/**"],
    globals: false,
  },
});
