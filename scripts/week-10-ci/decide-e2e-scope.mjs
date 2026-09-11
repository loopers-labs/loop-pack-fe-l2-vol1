// E2E 실행 범위를 한 곳에서 판정한다. workflow와 guard가 이 결정을 공유하고
// 조건을 두 번 계산하지 않는다 — 재계산이 갈라지면 침묵 생략이 성공으로 보인다.
// 핵심 E2E 조건: main 대상 AND non-draft AND 런타임 관련 변경.
import { appendFileSync } from 'node:fs';

const env = (name) => process.env[name] ?? '';

const eventName = env('EVENT_NAME');
const decision = { core: false, full: false, reason: '' };

if (eventName !== 'pull_request') {
  decision.full = true;
} else if (env('CHANGES_RESULT') !== 'success') {
  decision.reason = `변경 판별 실패(${env('CHANGES_RESULT')}) — 핵심 E2E 조건을 판정할 수 없다`;
} else {
  const baseRef = env('BASE_REF');
  const skips = [
    baseRef !== 'main' && `main 외 브랜치 대상(base: ${baseRef})`,
    env('IS_DRAFT') === 'true' && 'draft PR',
    env('RUNTIME') !== 'true' && '문서 전용 변경',
  ].filter(Boolean);
  decision.core = skips.length === 0;
  decision.reason = skips.join('; ');
}

const outputs = {
  core: decision.core,
  full: decision.full,
  browsers: decision.core || decision.full,
  periodic: eventName === 'schedule' || eventName === 'workflow_dispatch',
  reason: decision.reason,
};

const outputPath = env('GITHUB_OUTPUT');
if (!outputPath) {
  console.error('::error::E2E 범위 판정 실패 — GITHUB_OUTPUT이 없다.');
  process.exit(1);
}
appendFileSync(
  outputPath,
  Object.entries(outputs)
    .map(([key, value]) => `${key}=${value}\n`)
    .join(''),
);

const summary = decision.core
  ? '## E2E: 핵심 E2E 실행\n'
  : decision.full
    ? '## E2E: 전체 E2E 실행\n'
    : env('CHANGES_RESULT') !== 'success' && eventName === 'pull_request'
      ? `## E2E: 실행 불가\n\n${decision.reason}. guard가 병합을 차단한다.\n`
      : `## E2E: 의도적 생략\n\n이유: ${decision.reason}\n`;

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
}
console.log(summary);
