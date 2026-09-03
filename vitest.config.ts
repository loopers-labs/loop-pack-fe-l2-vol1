import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

const alias = {
  "@": fileURLToPath(new URL("./src", import.meta.url)),
};

// DOM이 필요한 테스트만 파일명으로 표시한다(*.dom.test.tsx).
// 접미사로 가른 이유는 docs/rfc/week08-test-plan.md에 적었다. 요약하면
// include/exclude 한 줄로 갈리고, 프로젝트별 setupFiles가 파일 단위로 정확히 붙는다.
const DOM_TESTS = "src/**/*.dom.test.{ts,tsx}";
const ALL_TESTS = "src/**/*.test.{ts,tsx}";

export default defineConfig({
  test: {
    // 한 명령으로 함께 돌리되 환경은 나눈다.
    // DOM이 필요 없는 테스트까지 매번 브라우저 흉내 환경을 세우지 않기 위해서다.
    projects: [
      {
        resolve: { alias },
        test: {
          name: "node",
          environment: "node",
          include: [ALL_TESTS],
          exclude: [...configDefaults.exclude, DOM_TESTS],
        },
      },
      {
        resolve: { alias },
        test: {
          name: "dom",
          environment: "jsdom",
          // origin이 없으면 fetchJson이 넘기는 상대 경로(/api/products)가
          // 요청 URL로 만들어지지 않아 MSW가 가로챌 대상 자체가 생기지 않는다.
          environmentOptions: { jsdom: { url: "http://localhost:3000" } },
          include: [DOM_TESTS],
          setupFiles: ["./vitest.setup.dom.ts"],
        },
      },
    ],
  },
});
