import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// @/ 별칭은 tsconfig와 맞춘다. 환경은 기본 node이고, DOM이 필요한 테스트만 jsdom으로 선언한다(아래).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  // 테스트는 클래스명을 검증하지 않으므로 프로젝트 PostCSS(Tailwind)를 태우지 않는다.
  // 이걸 비우지 않으면 CSS 모듈을 렌더하는 컴포넌트 테스트가 PostCSS 로드에서 실패한다.
  css: { postcss: { plugins: [] } },
  test: {
    // 기본은 node. DOM이 필요한 테스트만 파일 상단에 `// @vitest-environment jsdom`으로 선언한다.
    // 전부 jsdom으로 돌리면 DOM이 필요 없는 테스트까지 매번 브라우저 흉내 환경을 세워,
    // 테스트가 늘수록 비용이 쌓이기 때문이다.
    // (측정: `vitest run`의 environment 항목, 3회 median.
    //  분리 ~27s(24–31s) vs 전부 jsdom ~76s(69–82s).)
    environment: "node",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // appOrigin은 미설정 시 throw하므로 테스트 환경에 origin을 준다(비배포 컨텍스트).
    env: { APP_ORIGIN: "http://localhost:3000" },
    // e2e(Playwright)는 별도 러너라 제외한다. Advanced B의 생성 원본(docs/…)도 Playwright 문법이라
    // 같은 이유로 뺀다 — 검수용 증거일 뿐 실행 대상이 아니다(vitest가 주우면 test.describe에서 터진다).
    // .stryker-tmp는 프로젝트 사본이 든 뮤테이션 샌드박스라, 제외하지 않으면
    // 그 안의 (node_modules 포함) 테스트까지 주워 돈다.
    exclude: [
      "e2e/**",
      "docs/rfc/week09-advanced-b-generated/**",
      "**/node_modules/**",
      ".claude/**",
      ".stryker-tmp/**",
    ],
  },
});
