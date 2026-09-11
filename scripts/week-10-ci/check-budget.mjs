// build 산출물의 크기 예산 검사. size-limit CLI(.size-limit.mjs 설정)를 실행해
// 결과를 summary·리포트로 남기고 원래 종료 상태를 보존한다 — 출력이 게이트 결과를 덮지 않는다.
// 예산 대상 누락·수집 실패·임계값 없음은 모두 실패다.
import { spawnSync } from 'node:child_process';
import {
  appendFileSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

import { BUDGET_TARGETS, MEASURE_LABEL } from './budget-targets.mjs';

// .size-limit.mjs와 같은 루트를 쓴다 — 실행 검사가 픽스처로 돌 때 실제 리포트를 덮지 않게.
const root = process.env.BUDGET_ROOT ?? process.cwd();

const kib = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`;

// summary와 PR 코멘트가 같은 결과를 쓴다 — 표시를 위한 재측정도, 채널별 재작성도 하지 않는다.
// 미측정 사유도 파일로 남겨야 코멘트가 "왜 못 쟀는지"를 그대로 싣는다.
const writeSummary = (markdown) => {
  console.log(markdown);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`);
  }
  mkdirSync(join(root, 'reports'), { recursive: true });
  writeFileSync(join(root, 'reports/budget.md'), markdown);
};

const failEarly = (reason, detail) => {
  writeSummary(`## 번들 예산: 미측정\n\n${reason}\n`);
  if (detail) console.error(detail);
  console.error(`::error::번들 예산 검사 실패 — ${reason}`);
  process.exit(1);
};

const sizeLimit = spawnSync(
  join(process.cwd(), 'node_modules/.bin/size-limit'),
  ['--json'],
  { encoding: 'utf8' },
);

if (sizeLimit.error) {
  failEarly(`size-limit 실행 불가: ${sizeLimit.error.message}`);
}

let checks;
try {
  checks = JSON.parse(sizeLimit.stdout);
} catch {
  failEarly(
    'size-limit이 결과 JSON을 내지 못했다 — 대상 수집 실패',
    sizeLimit.stderr,
  );
}
// 설정 오류(수집 실패·임계값 누락)면 배열 대신 { error } JSON이 나온다.
if (!Array.isArray(checks)) {
  failEarly(
    String(checks?.error ?? '결과가 검사 배열이 아니다'),
    sizeLimit.stderr,
  );
}

const rows = [];
const problems = [];

for (const { id, label } of BUDGET_TARGETS) {
  const check = checks.find((c) => c.name === id);
  if (!check || typeof check.size !== 'number') {
    problems.push(`${label}(${id})의 측정 결과가 없다`);
    rows.push({ id, label, missing: true });
    continue;
  }
  if (typeof check.sizeLimit !== 'number') {
    problems.push(
      `${label}(${id})의 임계값이 없다 — 빈 검사를 통과로 두지 않는다`,
    );
    rows.push({ id, label, missing: true });
    continue;
  }
  rows.push({
    id,
    label,
    size: check.size,
    limit: check.sizeLimit,
    passed: check.size <= check.sizeLimit,
  });
}

// 고정 상한 판정과 별개로 "이 변경이 얼마나 늘렸나"를 함께 보여준다.
// 기준선은 main push가 남긴 측정값이라 없을 수도 있다 — 그러면 열을 생략한다.
let baseline = null;
try {
  baseline = JSON.parse(
    readFileSync(
      process.env.BUDGET_BASELINE_FILE ?? join(root, 'baseline/budget.json'),
      'utf8',
    ),
  );
} catch {
  baseline = null;
}

const signed = (bytes) =>
  `${bytes > 0 ? '+' : bytes < 0 ? '−' : '±'}${Math.abs(bytes).toLocaleString()} B`;

const changeCell = (row) => {
  const before = baseline?.rows?.find((entry) => entry.id === row.id)?.size;
  if (typeof before !== 'number') return '기준선 없음';
  const change = row.size - before;
  if (change === 0) return '변화 없음';
  return `${signed(change)} (${change > 0 ? '+' : '−'}${Math.abs((change / before) * 100).toFixed(1)}%)`;
};

const columns = ['대상', '집계', '측정값'];
if (baseline) columns.push(`base 대비`);
columns.push('임계값', '여유/초과', '판정');

const table = [
  `| ${columns.join(' | ')} |`,
  `| ${columns.map(() => '---').join(' | ')} |`,
  ...rows.map((row) => {
    if (row.missing) {
      const cells = [row.label, MEASURE_LABEL, '미측정'];
      if (baseline) cells.push('—');
      return `| ${[...cells, '—', '—', '❌'].join(' | ')} |`;
    }
    const headroom = row.limit - row.size;
    const headroomText =
      headroom >= 0
        ? `여유 ${headroom.toLocaleString()} B`
        : `**초과 ${(-headroom).toLocaleString()} B (+${((-headroom / row.limit) * 100).toFixed(1)}%)**`;
    const cells = [
      row.label,
      MEASURE_LABEL,
      `${row.size.toLocaleString()} B (${kib(row.size)})`,
    ];
    if (baseline) cells.push(changeCell(row));
    cells.push(
      `${row.limit.toLocaleString()} B`,
      headroomText,
      row.passed ? '✅' : '❌',
    );
    return `| ${cells.join(' | ')} |`;
  }),
].join('\n');

const baselineNote = baseline
  ? `\nbase 대비는 main \`${(baseline.sha || '알 수 없음').slice(0, 7)}\`의 같은 측정과 비교한 값이다.\n`
  : '\nbase 기준선이 없어 증가량은 비교하지 않았다.\n';

const allPassed = sizeLimit.status === 0 && problems.length === 0;
writeSummary(
  `## 번들 예산: ${allPassed ? 'PASS' : 'FAIL'}\n\n${table}\n\n측정값은 CI의 고정 압축 집계이며 실제 HTTP 전송량과 다르다.\n${baselineNote}`,
);

// 다음 PR의 기준선. main push의 이 파일을 캐시에 담아 PR이 내려받는다.
writeFileSync(
  join(root, 'reports/budget.json'),
  JSON.stringify(
    {
      sha: process.env.GITHUB_SHA ?? '',
      rows: rows
        .filter((row) => !row.missing)
        .map(({ id, size }) => ({ id, size })),
    },
    null,
    2,
  ),
);

for (const problem of problems) console.error(`::error::${problem}`);
if (sizeLimit.status !== 0) console.error(sizeLimit.stderr);
process.exit(allPassed ? 0 : sizeLimit.status || 1);
