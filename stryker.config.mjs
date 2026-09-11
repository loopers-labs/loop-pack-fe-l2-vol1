// 변이 테스트 — 8주차 RFC "Advanced — Stryker 범위"를 그대로 옮겼다.
// 대상은 1단계에서 단위로 분류한 파일만. ui·api 라우트는 통합/E2E 영역이라 제외.
// 점수 100%가 목표가 아니다: 살아남은 변형 중 의미 있는 것을 골라 테스트를 보강하고,
// 의미가 안 바뀌는 변형은 이유를 적는다.
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  // pnpm은 node_modules를 격리하므로 core의 자동 탐색(@stryker-mutator/*)이 러너를 못 찾는다. 명시한다.
  plugins: ['@stryker-mutator/vitest-runner'],
  testRunner: 'vitest',
  vitest: { configFile: 'vitest.stryker.config.ts' },
  mutate: [
    'src/_pages/products/model/**/*.ts',
    'src/entities/*/model/store.ts',
    'src/_pages/products/api/products.queries.ts',
    'src/shared/api/**/*.ts',
    '!src/**/*.test.ts',
  ],
  // json은 생존 변형을 스크립트로 추리기 위해(리포트 파일: reports/mutation/mutation.json)
  reporters: ['clear-text', 'progress', 'html', 'json'],
  htmlReporter: { fileName: 'reports/mutation/index.html' },
  tempDirName: '.stryker-tmp',
};
