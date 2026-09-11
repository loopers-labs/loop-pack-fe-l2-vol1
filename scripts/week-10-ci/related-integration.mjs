// PR의 런타임 변경에 관련된 앱 integration 테스트만 실행한다.
// unit·CLI integration 전체는 workflow의 별도 단계에서 항상 실행된다.
//
// 모드 결정:
// - skip: 런타임 변경 0개(문서 전용) — 판별 성공과 생략 이유를 기록한다.
// - full: 전체 영향 경로(공통 setup·MSW·빌드/테스트 설정·lockfile) 또는
//   디스크에 없는 변경 파일(삭제·이름 변경 — 정적 그래프로 관계 복원 불가).
// - related: 파일별 "선택 프로브"(어떤 테스트 이름과도 안 맞는 -t 필터, 실행 없이
//   수집만)로 관련 집합을 확인하고, 어느 파일이든 관련 0개면 전체로 폴백한다.
//   변경된 integration 테스트 파일 자체도 스스로 선택된다. 선택이 전부 있으면
//   합집합을 한 번만 실행한다 — 같은 테스트의 중복 실행도, 앞선 실패가
//   전체 재실행 성공에 덮이는 일도 없다.
// 판별 실패·리포트 수집 실패는 0개 성공으로 바꾸지 않고 exit 1이다.
import { spawnSync } from 'node:child_process';
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import path from 'node:path';

const INTEGRATION_PROJECTS = [
  '--project',
  'integration-node',
  '--project',
  'integration-jsdom',
];

const FULL_IMPACT_GLOBS = [
  'vitest.config.ts',
  'vitest.setup.ts',
  'vitest.msw.setup.ts',
  'tests/msw/**',
  'tests/render-*.tsx',
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  '.nvmrc',
  'tsconfig.json',
  'next.config.ts',
  'postcss.config.mjs',
  '.github/workflows/**',
];

const REPORT_PATH = 'reports/related-integration.json';

const fail = (message) => {
  console.error(`::error::관련 integration 판별 실패 — ${message}`);
  process.exit(1);
};

const writeSummary = (markdown) => {
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
  }
  console.log(markdown);
};

const runPnpm = (args) => {
  const result = spawnSync('pnpm', args, { stdio: 'inherit' });
  if (result.error) fail(`pnpm 실행 실패: ${result.error.message}`);
  return result.status ?? 1;
};

const raw = process.env.RUNTIME_FILES;
if (!raw) fail('RUNTIME_FILES가 비어 있다.');
let runtimeFiles;
try {
  runtimeFiles = JSON.parse(raw);
} catch {
  fail(`RUNTIME_FILES가 JSON이 아니다: ${raw.slice(0, 200)}`);
}
if (!Array.isArray(runtimeFiles)) fail('RUNTIME_FILES가 배열이 아니다.');

if (runtimeFiles.length === 0) {
  writeSummary(
    '## 관련 integration: 생략\n\n' +
      '런타임 변경 0개(문서 전용 PR) — 판별 성공, 관련 integration 0개는 의도된 생략이다.\n',
  );
  process.exit(0);
}

const runFull = (reason) => {
  writeSummary(`## 관련 integration: 전체 폴백\n\n${reason}\n`);
  process.exit(runPnpm(['exec', 'vitest', 'run', ...INTEGRATION_PROJECTS]));
};

const fullImpact = runtimeFiles.filter((file) =>
  FULL_IMPACT_GLOBS.some((glob) => path.matchesGlob(file, glob)),
);
if (fullImpact.length > 0) {
  runFull(
    `전체 영향 경로 변경: ${fullImpact.map((f) => `\`${f}\``).join(', ')}`,
  );
}

const missingOnDisk = runtimeFiles.filter((file) => !existsSync(file));
if (missingOnDisk.length > 0) {
  runFull(
    '삭제·이름 변경으로 정적 그래프에서 관계를 복원할 수 없다: ' +
      missingOnDisk.map((f) => `\`${f}\``).join(', '),
  );
}

// import 그래프에 들어올 수 없는 경로(루트 dotfile·scripts·public·e2e 등)는
// related가 항상 0개를 내놓아, 소스 변경과 섞이면 조용히 무시된다.
// 정적 그래프로 좁힐 수 없는 변경이 하나라도 있으면 전체를 실행한다.
// src/tests 안의 비-import 파일(favicon 등)까지는 못 가른다. 문제가 되면 모듈 그래프 조회로 승격.
const outsideGraph = runtimeFiles.filter(
  (file) => !file.startsWith('src/') && !file.startsWith('tests/'),
);
if (outsideGraph.length > 0) {
  runFull(
    '정적 의존 그래프 밖 경로 변경 — 관련 범위를 안전하게 좁힐 수 없다: ' +
      outsideGraph.map((f) => `\`${f}\``).join(', '),
  );
}

// 파일별 선택 프로브 — 다른 파일의 선택이 특정 파일의 관련성 공백을 가리지 않게
// 파일 단위로 확인한다. 프로브는 수집만 하고 실행하지 않으므로 비용은 파일당 수 초다.
const SELECTION_PROBE = ['-t', '__selection_probe__'];

mkdirSync(path.dirname(REPORT_PATH), { recursive: true });

const readSelected = (label) => {
  if (!existsSync(REPORT_PATH)) {
    fail(
      `vitest JSON 리포트가 없다 (${label}) — 수집 실패를 0개 성공으로 바꾸지 않는다.`,
    );
  }
  let report;
  try {
    report = JSON.parse(readFileSync(REPORT_PATH, 'utf8'));
  } catch {
    fail(`vitest JSON 리포트를 파싱할 수 없다 (${label}).`);
  }
  return {
    report,
    selected: (report.testResults ?? []).map((r) =>
      path.relative(process.cwd(), r.name),
    ),
  };
};

const perFile = runtimeFiles.map((file) => {
  rmSync(REPORT_PATH, { force: true });
  const exit = runPnpm([
    'exec',
    'vitest',
    'related',
    '--run',
    ...INTEGRATION_PROJECTS,
    '--passWithNoTests',
    ...SELECTION_PROBE,
    '--reporter=json',
    `--outputFile.json=${REPORT_PATH}`,
    file,
  ]);
  if (exit !== 0) fail(`선택 프로브가 exit ${exit}로 끝났다 (\`${file}\`).`);
  return { file, selected: readSelected(file).selected };
});

const gapFiles = perFile.filter((r) => r.selected.length === 0);
if (gapFiles.length > 0) {
  runFull(
    '관련 integration이 0개인 런타임 변경 — 정적 그래프로 좁힐 수 없거나 테스트 공백이다: ' +
      gapFiles.map((r) => `\`${r.file}\``).join(', '),
  );
}

// 합집합을 한 번만 실행한다 — 관련 테스트의 실패가 그대로 이 스크립트의 종료 코드다.
rmSync(REPORT_PATH, { force: true });
const unionExit = runPnpm([
  'exec',
  'vitest',
  'related',
  '--run',
  ...INTEGRATION_PROJECTS,
  '--reporter=default',
  '--reporter=json',
  `--outputFile.json=${REPORT_PATH}`,
  ...runtimeFiles,
]);
const { report, selected } = readSelected('합집합 실행');

const probedUnion = new Set(perFile.flatMap((r) => r.selected));
if (
  probedUnion.size !== selected.length ||
  selected.some((f) => !probedUnion.has(f))
) {
  fail('프로브 선택과 실행 선택이 다르다 — 판별을 신뢰할 수 없다.');
}

writeSummary(
  `## 관련 integration: ${selected.length}개 선택 (파일별 판별, 합집합 1회 실행)\n\n` +
    perFile.map((r) => `- \`${r.file}\` → ${r.selected.length}개`).join('\n') +
    `\n\n실행 목록:\n` +
    selected.map((f) => `- \`${f}\``).join('\n') +
    `\n\n결과: ${report.numPassedTests}/${report.numTotalTests} passed` +
    (report.numFailedTests > 0 ? `, **${report.numFailedTests} failed**` : '') +
    '\n',
);
process.exit(unionExit);
