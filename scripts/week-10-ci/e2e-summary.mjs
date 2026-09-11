// Playwright JSON 리포트에서 passed/flaky/failed/skipped를 집계해 summary에 남긴다.
// flaky·failed 제목을 노출해 재시도가 실패 원인을 숨기지 않게 한다.
import { appendFileSync, existsSync, readFileSync } from 'node:fs';

import { E2E_REPORT_PATH } from './e2e-report-path.mjs';

if (!existsSync(E2E_REPORT_PATH)) {
  console.error(
    '::error::E2E JSON 리포트가 없다 — 실행 증거 없이 집계를 통과시키지 않는다.',
  );
  process.exit(1);
}

let report;
try {
  report = JSON.parse(readFileSync(E2E_REPORT_PATH, 'utf8'));
} catch (error) {
  console.error(`::error::E2E JSON 리포트를 파싱할 수 없다: ${error.message}`);
  process.exit(1);
}

const collectSpecs = (suite, file = suite.file) => [
  ...(suite.specs ?? []).map((spec) => ({ ...spec, file })),
  ...(suite.suites ?? []).flatMap((child) => collectSpecs(child, file)),
];
const specs = (report.suites ?? []).flatMap((suite) => collectSpecs(suite));

const byStatus = (status) =>
  specs.filter((spec) => spec.tests.some((t) => t.status === status));
const formatSpecLine = (spec) => `- \`${spec.file}\` › ${spec.title}`;

const { stats } = report;
let summary =
  '## E2E 결과\n\n' +
  `passed ${stats.expected} · flaky ${stats.flaky} · failed ${stats.unexpected} · skipped ${stats.skipped}\n` +
  `\n### 실행 테스트 (${specs.length}개)\n${specs.map(formatSpecLine).join('\n')}\n`;

const flaky = byStatus('flaky');
if (flaky.length > 0) {
  summary += `\n### flaky (재시도 후 성공 — 원인 추적 대상)\n${flaky.map(formatSpecLine).join('\n')}\n`;
}
const failed = byStatus('unexpected');
if (failed.length > 0) {
  summary += `\n### failed (재시도 소진)\n${failed.map(formatSpecLine).join('\n')}\n`;
}

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
}
console.log(summary);
