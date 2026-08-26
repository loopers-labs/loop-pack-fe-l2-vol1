import { fileURLToPath } from 'node:url';
import { defineConfig, configDefaults } from 'vitest/config';

// [AI] Test Projects의 각 프로젝트는 루트의 resolve/setupFiles를 상속하지 않는다
// (검증함: 상속 가정 시 "@/..." import 해석 실패 + setup 0ms). 그래서 공통 설정을
// 팩토리로 만들어 각 프로젝트에 명시적으로 내려준다.
const makeProject = ({
  name,
  environment,
  include,
}: {
  name: 'node' | 'jsdom';
  environment: 'node' | 'jsdom';
  include: string[];
}) => ({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    name,
    environment,
    include,
    // [AI] setupFiles는 test 옵션 안에 있어야 한다. 최상위에 두면 로드되지 않아
    // vitest.setup.ts의 jest-dom 매처 등록이 누락되고 타입 에러도 발생한다.
    setupFiles: ['./vitest.setup.ts'],
    // [AI] Playwright(e2e/) 스펙이 vitest에 잡히지 않도록 기본 exclude를 확장한다.
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
});

export default defineConfig({
  test: {
    // [AI] Test Projects로 확장자별 기본 환경을 정의한다 (docs/rfc/week08-environment.md 섹션 1).
    // .test.ts → node, .test.tsx → jsdom이 config 기본값이고, 예외는 파일 상단의
    // `// @vitest-environment <환경>` 주석으로 덮어쓴다 (양방향 가능, 주석이 우선).
    // 현재 예외 3개: store.test.ts 2개(.ts+jsdom), HeroSection.test.tsx(.tsx+node).
    projects: [
      makeProject({ name: 'node', environment: 'node', include: ['src/**/*.test.ts'] }),
      makeProject({ name: 'jsdom', environment: 'jsdom', include: ['src/**/*.test.tsx'] }),
    ],
  },
});
