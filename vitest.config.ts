import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const alias = {
  "@": fileURLToPath(new URL("./src", import.meta.url)),
};

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        // node 환경: DOM이 필요 없는 테스트
        // 기준: .test.ts 파일 전체 + .tsx 확장자지만 DOM이 필요 없는 명시적 예외
        resolve: { alias },
        test: {
          name: "node",
          environment: "node",
          include: [
            "src/**/*.test.ts",
            "src/widgets/hero/index.test.tsx", // 예외: renderToStaticMarkup만 사용, DOM 불필요
          ],
        },
      },
      {
        // jsdom 환경: 컴포넌트 렌더링이 필요한 테스트
        resolve: { alias },
        plugins: [react()],
        test: {
          name: "jsdom",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          exclude: ["src/widgets/hero/index.test.tsx"],
          setupFiles: ["./src/test/setup.ts"],
        },
      },
    ],
  },
});