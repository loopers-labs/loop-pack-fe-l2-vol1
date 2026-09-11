// E2E가 "실제로 실행되어 스스로 통과"했는지 JSON 리포트의 테스트 단위로 검증한다.
// 집계 숫자(stats)만으로는 test.skip·fixme 격리와 test.fail 마킹이 성공으로 새므로,
// 각 테스트의 expectedStatus가 passed이고 결과가 expected/flaky인지 본다.
// MODE=core: 실행·통과 수가 CRITICAL_EXPECTED와 일치해야 한다 (태그 누락·0개 선택 차단).
// MODE=full: e2e의 전체 스펙 파일이 모두 실행돼야 한다 (배포 전 전체 검증 누락 차단).
import { appendFileSync, readFileSync, readdirSync } from 'node:fs';

import { E2E_REPORT_PATH } from './e2e-report-path.mjs';

const fail = (message) => {
  console.error(`::error::E2E 실행 검증 실패 — ${message}`);
  process.exit(1);
};

const mode = process.env.MODE;
if (mode !== 'core' && mode !== 'full') {
  fail(`MODE는 core 또는 full이어야 한다: ${mode}`);
}

let report;
try {
  report = JSON.parse(readFileSync(E2E_REPORT_PATH, 'utf8'));
} catch (error) {
  fail(`JSON 리포트를 읽을 수 없다 (${E2E_REPORT_PATH}): ${error.message}`);
}

const collectTests = (suite, file = suite.file) => [
  ...(suite.specs ?? []).flatMap((spec) =>
    spec.tests.map((test) => ({
      file,
      title: spec.title,
      expectedStatus: test.expectedStatus,
      status: test.status,
    })),
  ),
  ...(suite.suites ?? []).flatMap((child) => collectTests(child, file)),
];
const tests = (report.suites ?? []).flatMap((suite) => collectTests(suite));

if (tests.length === 0) {
  fail('실행된 테스트가 0개다.');
}

const unhealthy = tests.filter(
  (test) =>
    test.expectedStatus !== 'passed' ||
    (test.status !== 'expected' && test.status !== 'flaky'),
);
if (unhealthy.length > 0) {
  fail(
    '스킵·격리·fail 마킹·실패가 있다: ' +
      unhealthy
        .map((t) => `${t.file} › ${t.title} (${t.expectedStatus}/${t.status})`)
        .join(', '),
  );
}

if (mode === 'core') {
  const expected = Number(process.env.CRITICAL_EXPECTED);
  if (!Number.isInteger(expected) || expected <= 0) {
    fail(`CRITICAL_EXPECTED가 올바르지 않다: ${process.env.CRITICAL_EXPECTED}`);
  }
  if (tests.length !== expected) {
    fail(`실행·통과가 ${tests.length}개다 (기대 ${expected}개).`);
  }
} else {
  // playwright.config.ts의 testDir('./e2e')·기본 testMatch와 같은 대상을 훑는다 — testDir을 바꾸면 여기도 바꾼다.
  const fullSpecs = readdirSync('e2e', { recursive: true }).filter((file) =>
    /\.spec\.tsx?$/.test(file),
  );
  if (fullSpecs.length === 0) fail('e2e에서 스펙 파일을 찾지 못했다.');
  const ranFiles = new Set(tests.map((t) => t.file));
  const missing = fullSpecs.filter((f) => !ranFiles.has(f));
  if (missing.length > 0) {
    fail(`전체 E2E에서 실행되지 않은 스펙 파일: ${missing.join(', ')}`);
  }
}

const flakyCount = tests.filter((t) => t.status === 'flaky').length;
const message = `E2E ${tests.length}개 실행·통과 (flaky ${flakyCount}개, mode=${mode}).`;
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `## E2E 실행 범위: ${mode}\n\n${message}\n`,
  );
}
console.log(message);
