// @ts-check
/**
 * 뮤테이션 테스팅 — 테스트가 진짜 뭘 잡는지 기계가 확인한다.
 * CI 게이트가 아니라 수동 실행(pnpm test:mutation)이다. 느리고, 결과 판정은 사람이 한다.
 * E2E(Playwright)는 Stryker가 돌리지 못하므로 Vitest 테스트만 대상이다.
 * 초기 실행 테스트 수가 pnpm test보다 적은 건 vitest.related(기본값) 때문이다 —
 * 변이 대상과 무관한 테스트 파일(예: mutate에서 뺀 src/app/api의 테스트)은 돌지 않는다.
 *
 * @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
 */
export default {
  // pnpm의 심링크 node_modules에서는 @stryker-mutator/* 자동 탐색이 실패해 명시한다
  plugins: ['@stryker-mutator/vitest-runner'],
  testRunner: 'vitest',
  vitest: { configFile: 'vitest.config.ts' },
  mutate: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    // 스타터가 제공한 mock 백엔드는 과제 판별 대상이라 변이하지 않는다
    '!src/app/api/**',
  ],
  reporters: ['clear-text', 'progress', 'html'],
  htmlReporter: { fileName: 'reports/mutation/index.html' },
  tempDirName: '.stryker-tmp',
  // 샌드박스에 복사할 필요 없는 것. 심링크(.agents)는 복사 자체가 실패한다.
  ignorePatterns: [
    '.next',
    'reports',
    '.agents',
    '.claude',
    '.playwright-cli',
    '_workspace',
    'docs',
    'specs',
    'e2e',
    'private',
    'test-results',
    'public',
  ],
};
