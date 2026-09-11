// 번들 예산 게이트 — 브라우저로 내보내는 JS가 예산을 넘는지 본다.
//
//   node scripts/check-bundle-budget.mts            # 검사 (초과 시 exit 1)
//   node scripts/check-bundle-budget.mts --report   # 숫자만 출력하고 항상 exit 0
//
// **무엇을 재는가**: `.next/static/chunks`의 클라이언트 JS 전부를 파일별로 gzip해 더한다.
//
// 처음에는 build-manifest.json의 `rootMainFiles + polyfillFiles`(= 프레임워크 셸)만 쟀다.
// 그런데 클라이언트 컴포넌트에 128KB짜리 모듈을 억지로 물려 빌드해도 그 숫자가 **1바이트도
// 움직이지 않았다**. 셸은 Next 런타임이고 앱 코드는 별도 청크로 나간다. 앱 변경에 반응하지 않는
// 예산은 회귀를 막지 못하므로 대상을 전체 클라이언트 JS로 바꿨다. 셸은 참고로 같이 보여준다.
//
// 파일별로 gzip해서 더하는 이유: 브라우저는 파일을 각각 받는다. 전부 이어붙여 한 번에 gzip하면
// 사전이 공유돼 13KB쯤 작게 나오는데, 그건 실제로 내려가는 양이 아니다.
//
// 한계: 지연 로드되는 라우트 청크까지 포함하므로 "첫 화면 비용"이 아니라 "우리가 내보내는 총량"이다.
// Turbopack 빌드는 라우트별 클라이언트 매니페스트를 남기지 않아 진입점별로 가르려면 앱을 띄워
// HTML의 script 태그를 읽어야 한다. 그 복잡도를 지금은 지지 않는다.
//
// 압축은 gzip level 9로 통일한다. 실제 CDN은 brotli를 쓰는 경우가 많아 이 값은 보수적이다.

import { gzipSync } from 'node:zlib';
import { appendFileSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

// 7주차 스로틀 모델(1474.56Kbps = 184.32KB/s)로 바이트를 시간으로 환산한다.
const THROTTLED_KB_PER_SEC = 1474.56 / 8;

// 예산. 측정 시점 실측 237.5KB에 여유 10%를 얹었다. 근거는 docs/rfc/week10-ci.md.
const BUDGET_KB = 261;

const CHUNKS_DIR = '.next/static/chunks';

type BuildManifest = { rootMainFiles: string[]; polyfillFiles: string[] };

function isBuildManifest(value: unknown): value is BuildManifest {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    Array.isArray(record.rootMainFiles) && Array.isArray(record.polyfillFiles)
  );
}

function gzipKb(absolutePaths: string[]): number {
  const total = absolutePaths.reduce(
    (sum, file) => sum + gzipSync(readFileSync(file), { level: 9 }).byteLength,
    0,
  );
  return total / 1024;
}

function listChunks(): string[] {
  const dir = path.join(process.cwd(), CHUNKS_DIR);
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    throw new Error(`${CHUNKS_DIR}가 없다. 먼저 \`pnpm build\`를 돌려야 한다.`);
  }
  return entries
    .filter((name) => name.endsWith('.js'))
    .map((name) => path.join(dir, name));
}

function shellFiles(): string[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(
      readFileSync(
        path.join(process.cwd(), '.next/build-manifest.json'),
        'utf8',
      ),
    );
  } catch {
    return null;
  }
  if (!isBuildManifest(parsed)) return null;
  return [...parsed.rootMainFiles, ...parsed.polyfillFiles].map((file) =>
    path.join(process.cwd(), '.next', file),
  );
}

function format(kb: number): string {
  return `${kb.toFixed(1)}KB`;
}

function main(): number {
  const chunks = listChunks();
  const totalKb = gzipKb(chunks);
  const shell = shellFiles();
  const shellKb = shell === null ? null : gzipKb(shell);
  const overBy = totalKb - BUDGET_KB;
  const seconds = totalKb / THROTTLED_KB_PER_SEC;

  const verdict =
    overBy > 0
      ? `❌ 예산 초과 — ${format(overBy)} 넘었다 (${format(totalKb)} > ${format(BUDGET_KB)})`
      : `✅ 예산 안 — 여유 ${format(-overBy)} (${format(totalKb)} / ${format(BUDGET_KB)})`;

  const rows = [
    `| 항목 | gzip |`,
    `| --- | --- |`,
    `| **클라이언트 JS 전체** (${chunks.length}개) | **${format(totalKb)}** |`,
    shellKb === null
      ? `| 그중 프레임워크 셸 | 매니페스트를 못 읽음 |`
      : `| 그중 프레임워크 셸 | ${format(shellKb)} |`,
    shellKb === null
      ? `| 그중 앱 코드 | — |`
      : `| 그중 앱 코드 | ${format(totalKb - shellKb)} |`,
    `| 예산 | ${format(BUDGET_KB)} |`,
  ];

  const throttle = `7주차 스로틀 모델(1474.56Kbps)에서 이 JS의 전송만 ${seconds.toFixed(2)}초.`;

  const summary = [`### 번들 예산`, '', verdict, '', ...rows, '', throttle, ''];
  process.stdout.write(summary.join('\n') + '\n');

  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath !== undefined && summaryPath !== '') {
    appendFileSync(summaryPath, summary.join('\n') + '\n');
  }

  return process.argv.includes('--report') || overBy <= 0 ? 0 : 1;
}

process.exitCode = main();
