import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // 절대경로 alias: @ → src (tsconfig.app.json의 paths와 일치시킬 것)
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
